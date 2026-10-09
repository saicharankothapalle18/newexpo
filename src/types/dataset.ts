import { RawReport, UnifiedIncident, IncidentCategory, SeverityLevel } from './index';

export type DatasetFileFormat = 'EXCEL' | 'CSV' | 'JSON' | 'AUDIO';

export type DatasetFileProcessingStatus = 
    | 'QUEUED'
    | 'UPLOADING'
    | 'UPLOADED'
    | 'PARSING'
    | 'PARSED'
    | 'TRANSCRIBING'
    | 'TRANSCRIBED'
    | 'MAPPED'
    | 'COMPLETED'
    | 'ERROR';

export interface DatasetFileItem {
    id: string;
    file: File;
    name: string;
    size: number;
    format: DatasetFileFormat;
    status: DatasetFileProcessingStatus;
    uploadProgress: number; // 0 - 100
    serverPath?: string;
    checksum?: string;
    errorMessage?: string;
    
    // Extracted content
    parsedRows?: any[];
    detectedColumns?: string[];
    transcript?: string;
    extractedReports?: RawReport[];
}

export interface ColumnMappingConfig {
    idField?: string;
    titleField?: string;
    textField: string;
    categoryField?: string;
    severityField?: string;
    locationField?: string;
    timestampField?: string;
    affectedPeopleField?: string;
    sourceNameField?: string;
}

export type MatchClassification = 'SAME_INCIDENT' | 'NEW_INCIDENT' | 'UNCERTAIN';

export interface IncidentCorrelationMatch {
    report: RawReport;
    classification: MatchClassification;
    targetIncidentId?: string;
    targetIncidentTitle?: string;
    compositeScore: number;
    spatialScore: number;
    temporalScore: number;
    semanticScore: number;
    categoryScore: number;
    operatorOverridden?: boolean;
}

export interface DatasetBatchSummary {
    batchId: string;
    totalFiles: number;
    filesUploaded: number;
    filesFailed: number;
    filesProcessing: number;
    recordsExtracted: number;
    sameIncidentMatches: number;
    newIncidentsPotential: number;
    uncertainMatches: number;
    audioTranscribed: number;
    committedAt?: string;
}
