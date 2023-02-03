import * as util from "util";

export class VSLogger {
    public static readonly logTimeThreshold = 500;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static logTimedMessage(timeTaken: number, message: string, ...parameters: any[]): boolean {
        const fixedTimeTaken = " (" + timeTaken.toFixed(2) + "ms)";

        if (timeTaken < VSLogger.logTimeThreshold) {
            return false;
        }

        if ((parameters !== undefined || parameters !== null) && parameters.length !== 0) {
            const m: string = util.format(message, parameters);
            console.log(m.padEnd(60) + fixedTimeTaken);
        } else {
            console.log(message.padEnd(60) + fixedTimeTaken);
        }

        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static logWarningMessage(message: string, ...parameters: any[]): void {
        const trimmedLeftCount = message.length - message.trimStart().length;
        const spacesToLeft = " ".repeat(trimmedLeftCount);

        // TODO: Could this be colorized?
        if ((parameters !== undefined || parameters !== null) && parameters.length !== 0) {
            console.log(`${spacesToLeft}WARNING: ${util.format(message, parameters)}`);
        } else {
            console.log(`${spacesToLeft}WARNING: ${message}`);
        }
    }


    public static logException(message: string, ex: Error): void {
        VSLogger.logMessage(ex.name + ": " + message);
        if (ex !== undefined && ex.stack !== undefined) {
            VSLogger.logMessage(ex.stack);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static logMessage(message: string, ...parameters: any[]): void {
        if ((parameters !== undefined || parameters !== null) && parameters.length !== 0) {
            console.log(util.format(message, parameters));
        } else {
            console.log(message);
        }
    }
}






