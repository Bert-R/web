import React, { useContext, useState, useEffect } from 'react';
import { Dialog } from '@material-ui/core';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Alert, Autocomplete, Button, createFilterOptions, LinearProgress, TextField } from '@mui/material';
import AppContext from '../../../../context/AppContext';
import TracksManager from '../../../../context/TracksManager';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import { prepareFileName } from '../../../../util/Utils';

export default function SaveTrackDialog() {
    const ctx = useContext(AppContext);

    const [folder, setFolder] = useState(getOldGroup);
    const [fileName, setFileName] = useState(prepareFileName(ctx.selectedGpxFile.name));
    const [error, setError] = useState(false);
    const [existError, setExistError] = useState(false);
    const [existTrack, setExistTrack] = useState(false);
    const [process, setProcess] = useState(false);

    const cloudAutoSave = !!ctx.createTrack?.cloudAutoSave;

    const folders =
        ctx.tracksGroups?.map((group) => ({
            title: group.name,
        })) ?? [];

    function getOldGroup() {
        return ctx.selectedGpxFile.originalName
            ? TracksManager.getGroup(ctx.selectedGpxFile.originalName, false)
            : 'Tracks';
    }

    const closeDialog = ({ uploaded }) => {
        setProcess(false);
        if (uploaded) {
            // ctx.selectedGpxFile.clear = true; // no-more-need
        }
        ctx.selectedGpxFile.save = false;
        ctx.setSelectedGpxFile({ ...ctx.selectedGpxFile });
    };

    const getFolderName = (folder) => {
        if (folder === null) {
            return null;
        } else {
            if (typeof folder === 'string') {
                return folder;
            }
            if (folder.inputValue) {
                return folder.inputValue;
            }
            return folder.title;
        }
    };

    const filter = createFilterOptions();

    async function saveTrack() {
        const preparedName = prepareFileName(fileName);
        if (preparedName !== fileName) {
            setFileName(preparedName);
        }
        if (validName(preparedName)) {
            setProcess(true);
            if (!hasExistTrack(preparedName, folder)) {
                const uploaded = !!(await TracksManager.saveTrack(
                    ctx,
                    getFolderName(folder),
                    preparedName,
                    TracksManager.GPX_FILE_TYPE
                ));
                closeDialog({ uploaded });
            } else {
                setExistTrack(true);
            }
        } else {
            setError(true);
        }
    }

    async function confirmedSaveTrack() {
        const preparedName = prepareFileName(fileName);
        if (preparedName !== fileName) {
            setFileName(preparedName);
        }
        if (validName(preparedName)) {
            setProcess(true);
            const uploaded = !!(await TracksManager.saveTrack(
                ctx,
                getFolderName(folder),
                preparedName,
                TracksManager.GPX_FILE_TYPE
            ));
            closeDialog({ uploaded });
        } else {
            setError(true);
        }
    }

    function validName(name) {
        return name !== '' && name.trim().length > 0;
    }

    function hasExistTrack(name, folder) {
        const selectedGroup = ctx.tracksGroups?.find((g) => {
            if (folder.title) {
                return g.name === folder.title;
            } else {
                return g.name === folder;
            }
        });
        return selectedGroup ? selectedGroup.files.find((f) => TracksManager.prepareName(f.name) === name) : false;
    }

    useEffect(() => {
        if (cloudAutoSave) {
            confirmedSaveTrack();
        }
    }, []);

    const DialogUpdateTrack = ({ open, close }) => {
        return (
            <Dialog open={open} onClose={close}>
                <DialogContentText sx={{ margin: '10px' }}>{`Do you want to update the track?`}</DialogContentText>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setExistError(true);
                            setExistTrack(false);
                        }}
                    >
                        No
                    </Button>
                    <Button
                        onClick={() => {
                            setExistTrack(false);
                            confirmedSaveTrack();
                        }}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <div>
            <Dialog open={true} onClose={() => cloudAutoSave === false && closeDialog({ uploaded: false })}>
                {process ? <LinearProgress /> : <></>}
                {cloudAutoSave && <DialogTitle>Uploading to cloud...</DialogTitle>}
                {cloudAutoSave === false && (
                    <>
                        <DialogUpdateTrack open={existTrack} onClose={!existTrack} />
                        <DialogTitle>Save track</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to save the track to the cloud tracks?
                            </DialogContentText>
                            {error && (
                                <Alert
                                    onClose={() => {
                                        setError(false);
                                    }}
                                    severity="warning"
                                >
                                    You tried to save the wrong name!
                                </Alert>
                            )}
                            {existError && (
                                <Alert
                                    onClose={() => {
                                        setExistError(false);
                                    }}
                                    severity="warning"
                                >
                                    Select other name!
                                </Alert>
                            )}
                            <TextField
                                autoFocus
                                margin="dense"
                                onChange={(e) => {
                                    setFileName(e.target.value);
                                }}
                                label="Name"
                                id="fileName"
                                type="fileName"
                                fullWidth
                                error={fileName === ''}
                                helperText={fileName === '' ? 'Empty name!' : ' '}
                                variant="standard"
                                value={fileName ? fileName : ''}
                            ></TextField>
                            <Autocomplete
                                value={folder}
                                onChange={(event, newValue) => {
                                    setFolder(newValue);
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);
                                    const { inputValue } = params;
                                    const isExisting = options.some((option) => inputValue === option.title);
                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push({
                                            inputValue,
                                            title: `Add "${inputValue}"`,
                                        });
                                    }
                                    return filtered;
                                }}
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                id="folder"
                                options={folders}
                                getOptionLabel={(option) => getFolderName(option)}
                                renderOption={(props, option) => <li {...props}>{option.title}</li>}
                                freeSolo
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Folder"
                                        error={folder == null}
                                        helperText={folder == null ? 'Empty folder!' : ' '}
                                    />
                                )}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => closeDialog({ uploaded: false })}>Cancel</Button>
                            <Button
                                disabled={getFolderName(folder) === null || fileName === '' || error}
                                onClick={saveTrack}
                            >
                                Save
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </div>
    );
}
