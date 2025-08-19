
class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  // Only log in development
  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  // Only log in development
  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  // Always log errors
  error(...args: any[]) {
    console.error(...args);
  }

  // Only log warnings in development
  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  // Debug logs - only in development
  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.log("[DEBUG]", ...args);
    }
  }

  // Performance logs - only in development
  perf(label: string, fn: () => any) {
    if (this.isDevelopment) {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }

  // Group logs for better organization in development
  group(label: string, fn: () => void) {
    if (this.isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
