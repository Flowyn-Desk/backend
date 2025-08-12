import { LogType } from '../domain/enums/LogType';
import chalk from 'chalk';

export class Logger {
  private static readonly DEFAULT_COLORS: Record<LogType, chalk.Chalk> = {
    [LogType.ERROR]: chalk.red,
    [LogType.WARNING]: chalk.yellow,
    [LogType.DEBUG]: chalk.gray,
    [LogType.INFO]: chalk.greenBright,
  };

  private readonly who: string;

  private static _showDebug: boolean | undefined;
  private static _showTimestamp: boolean | undefined;

  constructor(who: string) {
    this.who = who;
  
    if (Logger._showDebug === undefined) {
      const envDebug = process.env.LOGGER_SHOW_DEBUG;
      if (envDebug === undefined) {
        Logger._showDebug = false;
      } else {
        Logger._showDebug = envDebug.toLowerCase() === 'true';
      }
    }
  
    if (Logger._showTimestamp === undefined) {
      const envTimestamp = process.env.LOGGER_SHOW_TIMESTAMP;
      if (envTimestamp === undefined) {
        Logger._showTimestamp = true;
      } else {
        Logger._showTimestamp = envTimestamp.toLowerCase() === 'true';
      }
    }
  }

  get debug(): boolean {
    return Logger._showDebug ?? false;
  }

  get showTimestamp(): boolean {
    return Logger._showTimestamp ?? true;
  }

  logError(message: string): void {
    this._write(LogType.ERROR, message);
  }

  logWarning(message: string): void {
    this._write(LogType.WARNING, message);
  }

  logDebug(message: string): void {
    if (this.debug) {
      this._write(LogType.DEBUG, message);
    }
  }

  logInfo(message: string): void {
    this._write(LogType.INFO, message);
  }

  private _write(logType: LogType, message: string, dateTime?: Date): void {
    const composedMessage = this._composeLogMessage(logType, message, dateTime);
    const colorFn = Logger.DEFAULT_COLORS[logType];
    console.log(colorFn(composedMessage));
  }

  private _composeLogMessage(logType: LogType, message: string, dateTime?: Date): string {
    dateTime = dateTime ?? new Date();

    if (this.showTimestamp) {
      const timestamp = dateTime.toISOString();
      return `${timestamp}|${logType}|${this.who}> ${message}`;
    } else {
      return `${logType}|${this.who}> ${message}`;
    }
  }
}
