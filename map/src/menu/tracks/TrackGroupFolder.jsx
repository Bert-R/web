import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import CloudTrackItem from './CloudTrackItem';
import CloudTrackGroup from './CloudTrackGroup';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import styles from './trackmenu.module.css';
import LocalGpxUploader from '../../frame/components/util/LocalGpxUploader';
import SortActions from './actions/SortActions';
import AppContext from '../../context/AppContext';
import { ReactComponent as BackIcon } from '../../assets/icons/ic_arrow_back.svg';
import { ReactComponent as ImportIcon } from '../../assets/icons/ic_action_folder_import_outlined.svg';
import { ReactComponent as TimeIcon } from '../../assets/icons/ic_action_time.svg';
import { useWindowSize } from '../../util/hooks/useWindowSize';
import SortMenu from './actions/SortMenu';

export default function TrackGroupFolder({ folder }) {
    const ctx = useContext(AppContext);

    const [openSort, setOpenSort] = useState(false);
    const [sortFiles, setSortFiles] = useState([]);
    const [sortGroups, setSortGroups] = useState([]);
    const [sortIcon, setSortIcon] = useState(<TimeIcon />);
    const [selectedSort, setSelectedSort] = useState(null);
    const anchorEl = useRef(null);
    const [, height] = useWindowSize();

    useEffect(() => {
        if (folder) {
            setSortFiles([]);
            setSortGroups([]);
        }
    }, [folder]);

    const trackItems = useMemo(() => {
        const items = [];
        (sortFiles.length > 0 ? sortFiles : folder.groupFiles).map((file) => {
            items.push(<CloudTrackItem key={'cloudtrack-' + file.name} file={file} />);
        });
        return items;
    }, [folder.groupFiles, folder.groupFiles.length, sortFiles]);

    const groupItems = useMemo(() => {
        const items = [];
        (sortGroups.length > 0 ? sortGroups : folder.subfolders).map((group, index) => {
            items.push(<CloudTrackGroup key={group.name + index} index={index} group={group} />);
        });
        return items;
    }, [folder.subfolders, folder.subfolders.length, sortGroups]);

    function prevTrackMenu() {
        ctx.openTrackGroups.pop();
        ctx.setOpenTrackGroups([...ctx.openTrackGroups]);
    }

    return (
        <Box minWidth={ctx.infoBlockWidth} maxWidth={ctx.infoBlockWidth} sx={{ overflow: 'hidden' }}>
            <AppBar position="static" className={styles.appbar}>
                <Toolbar className={styles.toolbar}>
                    <IconButton variant="contained" type="button" className={styles.appBarIcon} onClick={prevTrackMenu}>
                        <BackIcon />
                    </IconButton>
                    <Typography component="div" className={styles.title}>
                        {folder.name}
                    </Typography>
                    <Tooltip key={'sort_tracks'} title="Sort tracks" arrow placement="bottom-end">
                        <IconButton
                            variant="contained"
                            type="button"
                            className={styles.appBarIcon}
                            onClick={() => setOpenSort(true)}
                            disabled={!folder}
                            ref={anchorEl}
                        >
                            {sortIcon}
                        </IconButton>
                    </Tooltip>
                    <Tooltip key={'import_track'} title="Import track" arrow placement="bottom-end">
                        <span>
                            <LocalGpxUploader>
                                <IconButton
                                    component="span"
                                    variant="contained"
                                    type="button"
                                    className={styles.appBarIcon}
                                >
                                    <ImportIcon />
                                </IconButton>
                            </LocalGpxUploader>
                        </span>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <Box
                minWidth={ctx.infoBlockWidth}
                maxWidth={ctx.infoBlockWidth}
                sx={{ overflowX: 'hidden', overflowY: 'auto !important', maxHeight: `${height - 120}px` }}
            >
                {groupItems}
                {trackItems}
            </Box>
            <SortMenu
                openSort={openSort}
                setOpenSort={setOpenSort}
                anchorEl={anchorEl}
                actions={
                    <SortActions
                        files={folder.groupFiles}
                        setSortFiles={setSortFiles}
                        groups={folder.subfolders}
                        setSortGroups={setSortGroups}
                        setOpenSort={setOpenSort}
                        selectedSort={selectedSort}
                        setSelectedSort={setSelectedSort}
                        setSortIcon={setSortIcon}
                    />
                }
            />
        </Box>
    );
}