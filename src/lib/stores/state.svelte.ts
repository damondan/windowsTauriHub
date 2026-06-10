//Personal
interface AppSessionPersState {
	showOnlyLast: boolean;
    expandedRows: Record<string, boolean>;
    expandedRowsTexArea: Record<string, boolean>;
    showTopPers: boolean;
}

export const appPersState = $state<AppSessionPersState>({
    showOnlyLast: false,
    expandedRows: {} as Record<string,boolean>,
    expandedRowsTexArea: {} as Record<string, boolean>,
    showTopPers: false
});

//Professional
interface AppSessionProfState {
	showOnlyLast: boolean;
    expandedRowsProf: Record<string, boolean>;
    expandedRowsTexArea: Record<string, boolean>;
    showTopProf: boolean;
}

export const appProfState = $state<AppSessionProfState>({
    showOnlyLast: false,
    expandedRowsProf: {} as Record<string,boolean>,
    expandedRowsTexArea: {} as Record<string, boolean>,
    showTopProf: false
});