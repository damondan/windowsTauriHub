// src/lib/types.ts

export interface TauriApp {
	id: string;
	name: string;
	description: string;
	path: string;
	executable: string;
	icon?: string;
	status: "Running" | "Stopped" | "Error";
}

export type RecordingStatus = "Idle" | "Recording" | "Paused" | "Processing";
