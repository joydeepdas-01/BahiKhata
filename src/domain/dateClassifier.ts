export type DueStatus = 'pre_due' | 'due_today' | 'overdue';

export function classifyDueDate(dueDateInput: Date | string | number | null | undefined): DueStatus {
  if (!dueDateInput) {
    return 'pre_due';
  }

  const dueDate = new Date(dueDateInput);
  if (isNaN(dueDate.getTime())) {
    return 'pre_due';
  }

  // Zero-out hours/minutes/seconds/ms for date-only comparison in local timezone
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = due.getTime() - todayDate.getTime();

  if (diffTime < 0) {
    return 'overdue';
  } else if (diffTime === 0) {
    return 'due_today';
  } else {
    return 'pre_due';
  }
}

export function formatDaysDifference(dueDateInput: Date | string | number | null | undefined): string {
  if (!dueDateInput) return '';

  const dueDate = new Date(dueDateInput);
  if (isNaN(dueDate.getTime())) return '';

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = due.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return `${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else {
    return `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }
}

export function formatDisplayDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  // Format to standard Indian date display e.g. "25 Aug 2026" or "25 Aug"
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  
  if (year === currentYear) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}
