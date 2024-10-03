export function formatTimestampToAsiaJakarta(timestamp: number): string {
  // Convert Unix timestamp to milliseconds
  const date = new Date(timestamp * 1000);

  // Define options for formatting
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
  };

  // Format the date
  const formatter = new Intl.DateTimeFormat("id-ID", options);
  return formatter.format(date);
}

export function extractPhoneNumber(contactId: string): string {
  // Extract the part before '@' if it exists
  const idWithoutDomain = contactId.split("@")[0];

  // Further extract the part before '-' if it exists
  const phoneNumber = idWithoutDomain.split("-")[0];

  return phoneNumber;
}
