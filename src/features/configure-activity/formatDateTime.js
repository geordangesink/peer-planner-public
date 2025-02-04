// formats date for ActivityForm
export function formatDate(date) {
  const adjustedDate = new Date(date);
  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// formats time for ActivityForm
export function formatTime(date) {
  const adjustedDate = new Date(date);
  const hour = String(adjustedDate.getHours()).padStart(2, '0');
  const minute = Math.floor(adjustedDate.getMinutes() / 15) * 15;

  return `${hour}:${String(minute).padStart(2, '0')}`;
}
