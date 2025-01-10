/**
 * POSSIBLE IMPROVEMENTS
 * make invite key persis (when closing but not added yet and then re-open (pending invites))
 * invite key across room members (allows other room members to accept join)
 */
import { jsonToMap, mapToJson } from "./json-map-switch";
import Autobee from "./Autobee";
import BlindPairing from "blind-pairing";
import Corestore from "corestore";
import Hyperswarm from "hyperswarm";
import Hyperbee from "hyperbee";
import RAM from "random-access-memory";
import z32 from "z32";
import c from "compact-encoding";
import sodium from "sodium-native";
import { EventEmitter } from "events";

/**
 * Manages multiple calendar rooms and their resources
 * @typedef {Object} RoomManagerOptions
 * @property {string} [storageDir] - Optional storage directory path
 * @property {Corestore} [corestore] - Corestore instance
 * @property {Hyperbee} [localBee] - local hyperbee for personal storage (for now)
 * @property {Hyperswarm} [swarm] - Hyperswarm instance
 * @property {BlindPairing} [pairing] - BlindPairing instance
 * @property {Object} [rooms] - roomId key and room instance value
 */
export class RoomManager extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.storageDir = opts.storageDir || "./calendarStorage";
    this.corestore = new Corestore(this.storageDir);
    this._localBee = null;
    this.swarm = new Hyperswarm();
    this.pairing = new BlindPairing(this.swarm);
    this.rooms = {};
  }

  get localBee() {
    if (!this._localBee) {
      throw new Error("localBee is not ready. Did you call `await ready()`?");
    }
    return this._localBee;
  }

  /**
   * waits till localBee is ready and all rooms are initiated
   */
  async ready() {
    await this.corestore.ready();
    this._localBee = new Hyperbee(this.corestore.namespace("localData").get({ name: "localBee" }), {
      keyEncoding: "utf-8",
      valueEncoding: c.any,
    });
    await this._localBee.ready();
    await this.openAllReadyRooms();
  }

  /**
   * Gets configuration options for a new room
   * @param {string} roomId - Unique room identifier
   * @returns {Object} Room configuration options
   */
  getRoomOptions(roomId) {
    const corestore = roomId ? this.corestore.namespace(roomId) : this.corestore;
    return { corestore, swarm: this.swarm, pairing: this.pairing };
  }

  /**
   * initializes a calendar room
   * (or creates if no roomId provided)
   * @param {Object} [opts={}] - Room configuration options
   * @param {string} [opts.invite] - Optional invite code
   * @param {Buffer} [opts.topic] - topic key of room (when joining/opening)
   * @param {Object} [opts.metadata] - Optional room metadata
   * @returns {CalendarRoom} New room instance
   */
  initRoom(opts = {}) {
    const roomId = opts.roomId || generateRoomId();
    const baseOpts = this.getRoomOptions(roomId);
    if (opts.invite) baseOpts.invite = opts.invite;
    baseOpts.topic = opts.topic || generateTopic();
    baseOpts.metadata = opts.metadata || {};
    baseOpts.roomId = roomId;
    baseOpts.info = opts.info;
    const room = new CalendarRoom(baseOpts);
    this.rooms[roomId] = room;
    room.on("roomClosed", () => {
      delete this.rooms[roomId];
      if (this.closingDown) return;
      if (Object.keys(this.rooms).length > 0) return;
      process.nextTick(() => this.emit("lastRoomClosed"));
    });
    if (opts.isNew) this._saveRoom(room);
    process.nextTick(() => this.emit("newRoom", room));
    return room;
  }

  async initReadyRoom(opts = {}) {
    const room = this.initRoom(opts);
    const inviteHex = await room.ready();

    process.nextTick(() => this.emit("readyRoom", room));
    return { room, inviteHex };
  }

  async updateRoomInfo(room) {
    try {
      const roomsInfoDb = await this.localBee.get("roomsInfo");
      const roomsInfoMap = jsonToMap(roomsInfoDb.value.toString());
      roomsInfoMap.get(room.roomId).set("info", room.info);
      await this.localBee.put("roomsInfo", Buffer.from(mapToJson(roomsInfoMap)));
    } catch (err) {
      console.error("error updating room. does the room exist?", err);
    }
  }

  async openAllReadyRooms() {
    const roomsInfo = await this.localBee.get("roomsInfo");
    if (roomsInfo && roomsInfo.value) {
      const roomsInfoMap = jsonToMap(roomsInfo.value.toString());
      for (const [roomId, infoMap] of roomsInfoMap) {
        const info = infoMap.get("info");
        const topic = infoMap.get("topic");
        await this.initReadyRoom({ info, roomId, topic: z32.decode(topic) });
      }
    }
  }

  async deleteRoom(room) {
    // TODO: delete room from storage and db
  }

  /**
   *  store folder key and room id in personal db
   */
  async _saveRoom(room) {
    room.on("allDataThere", async () => {
      const roomsInfoDb = await this.localBee.get("roomsInfo");
      const roomsInfoMap = roomsInfoDb && roomsInfoDb.value ? jsonToMap(roomsInfoDb.value.toString()) : new Map();
      if (!roomsInfoMap.has(room.roomId)) {
        const detailsMap = new Map([
          ["info", room.info],
          ["topic", z32.encode(room.topic)],
        ]);
        roomsInfoMap.set(room.roomId, detailsMap);
        await this.localBee.put("roomsInfo", Buffer.from(mapToJson(roomsInfoMap)));
      }
    });
  }

  async cleanup() {
    const exitPromises = Object.values(this.rooms).map((room) => room.exit());
    await Promise.all(exitPromises);
    this.rooms = {};

    // Clean up other resources
    await this.pairing.close();
    await this.swarm.destroy();
    await this.corestore.close();
  }

  isClosingDown() {
    return this.closingDown;
  }
}

/**
 * @typedef {Object} CalendarRoomOptions
 * @property {string} [roomId] -  room identifier
 * @property {Corestore} [corestore] - Optional Corestore instance
 * @property {string} [storageDir] - Optional storage directory
 * @property {Hyperswarm} [swarm] - Optional Hyperswarm instance
 * @property {BlindPairing} [pairing] - Optional BlindPairing instance
 * @property {string} [invite] - Optional invite code
 * @property {Object} [metadata] - Optional room metadata
 */

/**
 * Represents a single calendar room for peer-planning
 * @extends EventEmitter
 */
export class CalendarRoom extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.info = opts.info || {};
    this.roomId = opts.roomId || generateRoomId();
    this.topic = opts.topic;
    this.internalManaged = { corestore: false, swarm: false, pairing: false };
    if (opts.corestore) this.corestore = opts.corestore;
    else {
      this.internalManaged.corestore = true;
      if (opts.storageDir) this.corestore = new Corestore(opts.storageDir);
      else this.corestore = new Corestore(RAM.reusable());
    }
    this.swarm = opts.swarm ? opts.swarm : ((this.internalManaged.swarm = true), new Hyperswarm());
    this.pairing = opts.pairing ? opts.pairing : ((this.internalManaged.pairing = true), new BlindPairing(this.swarm));
    this.autobee = new Autobee(this.corestore, null, { apply, valueEncoding: c.any }).on("error", (err) =>
      console.error("An error occurred in Autobee:", err)
    );
    this.inviteHex = opts.invite;
    if (opts.invite) this.invite = z32.decode(opts.invite);
    this.metadata = opts.metadata || {};
    this.initialized = false;
  }

  /**
   * Initializes the room and sets up event handlers
   * @returns {Promise<string|void>} Returns invite code if room is host
   */
  async ready() {
    if (this.initialized) return this.invite;
    this.initialized = true;
    await this.autobee.ready();

    this.swarm.on("connection", async (conn) => {
      console.log("new peer connected!");
      await this.corestore.replicate(conn);
    });

    if (this.invite) {
      const candidate = this.pairing.addCandidate({
        invite: this.invite,
        userData: this.autobee.local.key,
        onadd: async (result) => this._onHostInvite(result),
      });
      await candidate.paring;
    } else {
      const baseOpts = {
        data: this.topic,
        sensitive: false,
        expires: 0,
      };
      const { invite, publicKey, discoveryKey, additional } = BlindPairing.createInvite(
        this.autobee.local.key,
        baseOpts
      );
      this.metadata.host = {
        publicKey: z32.encode(publicKey),
        discoveryKey: z32.encode(discoveryKey),
      };
      const member = this.pairing.addMember({
        discoveryKey,
        onadd: (candidate) => this._onAddMember(publicKey, candidate, additional),
      });
      await member.flushed();
      this.topic = this.topic || generateTopic();
      this.emit("allDataThere");
      this._connectTopic();

      this.invite = invite;
      this.inviteHex = z32.encode(invite);
      return this.inviteHex;
    }
  }

  /**
   * TODO
   * NOT IMPLEMENTED YET
   * adjusts the rooms calendar
   * @param {Map} data - Canlendar Map
   * @returns {Promise<void>}
   */
  async _adjustCalendar(data) {
    await this.autobee.append({
      when: Date.now(),
      who: z32.encode(this.autobee.local.key),
      data,
    });
  }

  async _onHostInvite(result) {
    if (result.data) this.topic = result.data;
    if (result.key) {
      this._connectOtherCore(result.key);
      this.metadata.host = {
        publicKey: z32.encode(result.key),
      };
    }
    this.emit("allDataThere");
    this._connectTopic();
  }

  async _onAddMember(publicKey, candidate, additional) {
    candidate.open(publicKey);
    candidate.confirm({ key: this.autobee.local.key, additional });
    this._connectOtherCore(candidate.userData);
  }

  async _connectOtherCore(key) {
    await this.autobee.append({ type: "addWriter", key });
    this.emit("peerEntered", z32.encode(key));
  }

  async _connectTopic() {
    try {
      console.log("joining topic on", z32.encode(this.topic));
      const discovery = this.swarm.join(this.topic);
      await discovery.flushed();
    } catch (err) {
      console.error("Error joining swarm topic", err);
    }
  }

  async leave() {
    // TODO: remove self as writer
  }

  async exit() {
    await this.autobee.update();
    this.swarm.leave(this.autobee.local.discoveryKey);
    this.swarm.leave(this.topic);
    await this.autobee.close();
    if (this.internalManaged.pairing) await this.pairing.close();
    if (this.internalManaged.swarm) await this.swarm.destroy();
    if (this.internalManaged.corestore) await this.corestore.close();
    this.emit("roomClosed");
    this.removeAllListeners(); // clean up listeners
  }

  isClosingDown() {
    return this.closingDown;
  }
}

/**
 * Applies updates to autobee
 * @param {Array} batch - Array of nodes to process
 * @param {Object} view - View instance
 * @param {Object} base - Base instance
 * @returns {Promise<void>}
 */
async function apply(batch, view, base) {
  for (const node of batch) {
    const op = node.value;

    // handling "updateSchedule" operation: update requests and schedule between shared peers
    if (op.type === "updateSchedule") {
      const scheduleMap = jsonToMap(op.schedule);
      // TODO: add api to request a new change
      // TODO: add api to calculate free time for both parties (store their sharing calendar in autobee)
    }

    if (op.type === "addWriter") {
      console.log("\rAdding writer", z32.encode(op.key));
      await base.addWriter(op.key);
      continue;
    }

    if (op.type === "removeWriter") {
      console.log("\rRemoving writer", z32.encode(op.key));
      await base.removeWriter(op.key);
      continue;
    }
  }
  // Pass through to Autobee's default apply behavior
  await Autobee.apply(batch, view, base);
}

/**
 * Generates a unique room identifier
 * @returns {string} Unique room ID combining timestamp and random string
 */
function generateRoomId() {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = Math.random().toString(36).slice(2, 5); // 5 random chars
  return `room-${timestamp}-${random}`;
}

/**
 * @returns {Buffer} - random buffer topic
 */
function generateTopic() {
  const buffer = Buffer.alloc(32);
  sodium.randombytes_buf(buffer);
  return buffer;
}
