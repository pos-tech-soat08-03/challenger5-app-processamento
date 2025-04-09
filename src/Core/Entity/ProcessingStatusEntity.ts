import { v4 as uuidv4 } from 'uuid';
import { ProcessingStatusEnum } from './ValueObject/ProcessingStatusEnum';

export class ProcessingStatusEntity {
    private readonly processingId: string;
    private readonly createdAt: Date;
    private updatedAt: Date | undefined;
    private finishedAt: Date | undefined;
    private processingLog: string = "";
    private processingStatus: ProcessingStatusEnum;
    private processingStatusPercentage: number = 0;
    private videoId: string;
    private userId: string;

    constructor (userId: string, videoId: string, processingStatus: ProcessingStatusEnum, processingStatusPercentage?: number, processingLog?: string, createdAt?: Date,  updatedAt?: Date, finishedAt?: Date, processingId?: string) {
        
        this.processingId = processingId ?? uuidv4();
        
        this.userId = userId;
        this.videoId = videoId;
        this.createdAt = createdAt ?? new Date();
        this.processingStatus = processingStatus;
        this.processingStatusPercentage = processingStatusPercentage ?? 0;
        this.processingLog = processingLog ?? "";
        this.updatedAt = updatedAt;
        this.finishedAt = finishedAt;
    }
    
    public getProcessingId(): string {
        return this.processingId;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }

    public getUpdatedAt(): Date | undefined {
        return this.updatedAt;
    }

    public getFinishedAt(): Date | undefined {
        return this.finishedAt;
    }

    public getProcessingLog(): string {
        return this.processingLog;
    }

    public getProcessingStatus(): ProcessingStatusEnum {
        return this.processingStatus;
    }

    public getProcessingStatusPercentage(): number {
        return this.processingStatusPercentage;
    }

    public getProcessingVideoId(): string {
        return this.videoId;
    }

    public setProcessingStatus(processingStatus: ProcessingStatusEnum): void {
        this.processingStatus = processingStatus;
    }

    public setProcessingStatusPercentage(processingStatusPercentage: number): void {
        this.processingStatusPercentage = processingStatusPercentage;
    }

    public appendProcessingLog(processingLog: string): void {
        this.processingLog = this.processingLog.concat(`\n${processingLog}`);
    }

    public setUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }

    public setFinishedAt(finishedAt: Date): void {
        this.finishedAt = finishedAt;
    }

    public getUserId(): string {
        return this.userId;
    }

}