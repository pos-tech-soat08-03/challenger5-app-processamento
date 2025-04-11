import { ProcessingStatusEntity } from '../../../../src/Core/Entity/ProcessingStatusEntity';
import { ProcessingStatusEnum } from '../../../../src/Core/Entity/ValueObject/ProcessingStatusEnum';

describe('ProcessingStatusEntity', () => {
    const mockUserId = 'user-123';
    const mockVideoId = 'video-456';
    const mockProcessingStatus = ProcessingStatusEnum.PROCESSING;

    it('should create an instance with default values', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);

        expect(entity.getProcessingId()).toBeDefined();
        expect(entity.getUserId()).toBe(mockUserId);
        expect(entity.getProcessingVideoId()).toBe(mockVideoId);
        expect(entity.getProcessingStatus()).toBe(mockProcessingStatus);
        expect(entity.getProcessingStatusPercentage()).toBe(0);
        expect(entity.getProcessingLog()).toBe('');
        expect(entity.getCreatedAt()).toBeInstanceOf(Date);
        expect(entity.getUpdatedAt()).toBeUndefined();
        expect(entity.getFinishedAt()).toBeUndefined();
    });

    it('should allow setting and getting processing status', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);
        entity.setProcessingStatus(ProcessingStatusEnum.DONE);

        expect(entity.getProcessingStatus()).toBe(ProcessingStatusEnum.DONE);
    });

    it('should allow setting and getting processing status percentage', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);
        entity.setProcessingStatusPercentage(50);

        expect(entity.getProcessingStatusPercentage()).toBe(50);
    });

    it('should allow setting and appending to processing log', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);
        entity.appendProcessingLog('Log entry 1');
        entity.appendProcessingLog('Log entry 2');

        expect(entity.getProcessingLog()).toContain('Log entry 1');
        expect(entity.getProcessingLog()).toContain('Log entry 2');
    });

    it('should allow setting and getting updatedAt', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);
        const updatedAt = new Date();
        entity.setUpdatedAt(updatedAt);

        expect(entity.getUpdatedAt()).toBe(updatedAt);
    });

    it('should allow setting and getting finishedAt', () => {
        const entity = new ProcessingStatusEntity(mockUserId, mockVideoId, mockProcessingStatus);
        const finishedAt = new Date();
        entity.setFinishedAt(finishedAt);

        expect(entity.getFinishedAt()).toBe(finishedAt);
    });

    it('should retain provided values during initialization', () => {
        const createdAt = new Date('2023-01-01T00:00:00Z');
        const updatedAt = new Date('2023-01-02T00:00:00Z');
        const finishedAt = new Date('2023-01-03T00:00:00Z');
        const processingId = 'custom-id';
        const processingLog = 'Initial log';
        const processingStatusPercentage = 75;

        const entity = new ProcessingStatusEntity(
            mockUserId,
            mockVideoId,
            mockProcessingStatus,
            processingStatusPercentage,
            processingLog,
            createdAt,
            updatedAt,
            finishedAt,
            processingId
        );

        expect(entity.getProcessingId()).toBe(processingId);
        expect(entity.getCreatedAt()).toBe(createdAt);
        expect(entity.getUpdatedAt()).toBe(updatedAt);
        expect(entity.getFinishedAt()).toBe(finishedAt);
        expect(entity.getProcessingLog()).toBe(processingLog);
        expect(entity.getProcessingStatusPercentage()).toBe(processingStatusPercentage);
    });
});