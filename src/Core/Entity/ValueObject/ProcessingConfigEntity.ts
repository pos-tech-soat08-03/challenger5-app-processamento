import { v4 as uuidv4 } from 'uuid';

export class ProcessingConfigEntity {

    private readonly id: string;
    private readonly outputFormat: string;
    private readonly resolution: string;
    private readonly interval: number;
    
    constructor (outputFormat: string, resolution: string, interval: number, id?: string) {
        this.outputFormat = outputFormat;
        this.resolution = resolution;
        this.interval = interval;

        if (!id) {
            id = uuidv4();
        }
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

    public getOutputFormat(): string {
        return this.outputFormat;
    }

    public getResolution(): string {
        return this.resolution;
    }

    public getInterval(): number {
        return this.interval;
    }

}