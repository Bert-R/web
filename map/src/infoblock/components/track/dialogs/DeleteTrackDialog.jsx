import React, { useContext } from 'react';
import { Dialog } from '@material-ui/core';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { Button } from '@mui/material';
import AppContext from '../../../../context/AppContext';
import TracksManager from '../../../../context/TracksManager';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import { apiPost } from '../../../../util/HttpApi';

export default function DeleteTrackDialog({ dialogOpen, setDialogOpen, setShowInfoBlock }) {
    const ctx = useContext(AppContext);

    const place =
        ctx.currentObjectType === ctx.OBJECT_TYPE_CLOUD_TRACK
            ? 'cloud'
            : ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK
            ? 'local'
            : '';

    const toggleShowDialog = () => {
        setDialogOpen(!dialogOpen);
    };

    function cleanContextMenu() {
        setDialogOpen(false);
        setShowInfoBlock(false);
    }

    async function deleteCurrentTrack() {
        if (ctx.currentObjectType === ctx.OBJECT_TYPE_CLOUD_TRACK && ctx.loginUser) {
            const response = await apiPost(`${process.env.REACT_APP_USER_API_SITE}/mapapi/delete-file`, '', {
                params: {
                    name: ctx.selectedGpxFile.name,
                    type: 'GPX',
                },
            });
            if (response.status === 200) {
                // delete layer
                const newGpxFiles = Object.assign({}, ctx.gpxFiles);
                newGpxFiles[ctx.selectedGpxFile.name].url = null;
                ctx.setGpxFiles(newGpxFiles);

                // delete track from menu
                const newTracksGroups = [...ctx.tracksGroups];
                newTracksGroups?.forEach((group) => {
                    const currentFile = group.files.findIndex((file) => file.name === ctx.selectedGpxFile.name);
                    if (currentFile !== -1) {
                        group.files.splice(currentFile, 1);
                    }
                });
                ctx.setTracksGroups(newTracksGroups);

                cleanContextMenu();
            }
        } else if (ctx.currentObjectType === ctx.OBJECT_TYPE_LOCAL_CLIENT_TRACK) {
            TracksManager.deleteLocalTrack(ctx);
            cleanContextMenu();
        }
    }

    return (
        <Dialog open={true} onClose={toggleShowDialog}>
            <DialogTitle>Delete track</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {`Are you sure you want to delete ${TracksManager.prepareName(
                        ctx.selectedGpxFile.name
                    )} track from the ${place} tracks?`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={toggleShowDialog}>Cancel</Button>
                <Button onClick={() => deleteCurrentTrack()}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
}
