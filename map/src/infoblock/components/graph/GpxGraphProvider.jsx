import React, { useContext, useEffect, useMemo, useState } from 'react';
import GpxGraph from './GpxGraph';
import AppContext from '../../../context/AppContext';
import TracksManager, {
    addDistanceToPoints,
    equalsPoints,
    getAllPoints,
    getTrackPoints,
} from '../../../manager/TracksManager';
import _ from 'lodash';
import { Checkbox, Divider, FormControlLabel } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import { seleniumUpdateActivity } from '../../../util/Utils';
import {
    checkShowData,
    DISTANCE,
    ELEVATION,
    ELEVATION_SRTM,
    generateDataSets,
    getSlopes,
    HIGHWAY,
    isSrtmAppeared,
    SLOPE,
    SPEED,
    SURFACE,
    UNDEFINED_DATA,
} from '../../../manager/GraphManager';

const useStyles = makeStyles({
    checkbox: {
        '& .MuiTypography-root': {
            fontSize: '12',
        },
        transform: 'scale(0.8)',
    },
});

const GpxGraphProvider = ({ width, data, roadPoints, showData }) => {
    const ctx = useContext(AppContext);
    const classes = useStyles();

    //const [data, setData] = useState(null);
    //const [showData, setShowData] = useState(null);
   // const [roadPoints, setRoadPoints] = useState(null);

    function hasData() {
        return showData[ELEVATION] || showData[ELEVATION_SRTM] || showData[SPEED] || showData[SLOPE];
    }

    const mainGraphData = useMemo(() => {
        console.log(data)
        if (!_.isEmpty(data?.data)) {
            let elevation = data.ele ? 'ele' : null;
            let elevationSRTM = data.srtm ? 'srtmEle' : null;
            let points = _.cloneDeep(data.data);
            let result = [];
            let minEle = elevation ? points[0][elevation] : elevationSRTM ? points[0][elevationSRTM] : null;
            let maxEle = elevation ? points[0][elevation] : elevationSRTM ? points[0][elevationSRTM] : null;
            let minSpeed = data.speed ? 0 : null;
            let maxSpeed = data.speed ? 0 : null;
            let sumDist = 0;
            points.forEach((point) => {
                let ele;
                let eleSRTM;
                let speed;
                if (elevation) {
                    ele = TracksManager.getEle(point, elevation, points)?.toFixed(2);
                    if (ele !== undefined) {
                        ele = Math.round(ele * 10) / 10;
                        if (minEle === TracksManager.NAN_MARKER) {
                            minEle = ele;
                        } else {
                            minEle = Math.min(ele, minEle);
                        }

                        if (maxEle === TracksManager.NAN_MARKER) {
                            maxEle = ele;
                        } else {
                            maxEle = Math.max(ele, maxEle);
                        }
                    }
                }
                if (elevationSRTM) {
                    eleSRTM = TracksManager.getEle(point, elevationSRTM, points)?.toFixed(2);
                    if (eleSRTM && !elevation) {
                        eleSRTM = Math.round(eleSRTM * 10) / 10;
                        minEle = Math.min(eleSRTM, minEle);
                        maxEle = Math.max(eleSRTM, maxEle);
                    }
                }
                if (data.speed) {
                    speed = _.cloneDeep(
                        point.speed ? point.speed : point.ext?.speed ? point.ext?.speed : point.ext?.extensions?.speed
                    );
                    if (speed) {
                        speed = ((Math.round(speed * 10) / 10) * 3.6).toFixed(2);
                        minSpeed = Math.min(speed, minSpeed);
                        maxSpeed = Math.max(speed, maxSpeed);
                    }
                }

                // get-analysis might make point.distance inaccurate, so use "total" first
                if (point.distanceTotal > 0 || point.distanceSegment > 0 || point.ext?.distance > 0) {
                    sumDist = point.distanceTotal || point.distanceSegment || point.ext?.distance;
                } else if (point.distance || point.distance === 0) {
                    sumDist += point.distance;
                }

                let dataTab = {
                    [DISTANCE]: Math.round(sumDist) / 1000,
                    [ELEVATION]: ele,
                    [ELEVATION_SRTM]: eleSRTM,
                    [SPEED]: speed,
                };
                result.push(dataTab);
            });
            return {
                res: result,
                minEle: minEle,
                maxEle: maxEle,
                minSpeed: minSpeed,
                maxSpeed: maxSpeed,
                slopes: getSlopes(result, ctx),
            };
        }
    }, [data]);

    const attrGraphData = useMemo(() => {
        if (roadPoints) {
            addDistanceToPoints(roadPoints);
            let segments = [];
            let prevSegPoint;
            roadPoints.forEach((p) => {
                if (p.segment && p.segment.ext.types) {
                    const routeTypes = p.segment.routeTypes;
                    let seg = _.cloneDeep(p);
                    seg.ind = _.indexOf(roadPoints, p);
                    seg.distance = prevSegPoint
                        ? roadPoints[seg.ind + Number(seg.segment.ext.length) - 1].distanceTotal - seg.distanceTotal
                        : roadPoints[seg.ind + Number(seg.segment.ext.length) - 1].distanceTotal;
                    seg[HIGHWAY] = UNDEFINED_DATA;
                    seg[SURFACE] = UNDEFINED_DATA;
                    p.segment.ext.types.split(',').forEach((t) => {
                        const type = routeTypes[t];
                        if (type) {
                            if (type.tag === HIGHWAY) {
                                seg[HIGHWAY] = type.value;
                            }
                            if (type.tag === SURFACE) {
                                seg[SURFACE] = type.value;
                            }
                        }
                    });
                    prevSegPoint = seg;
                    segments.push(seg);
                }
            });
            return generateDataSets(segments);
        }
    }, [roadPoints]);

    return (
        <>
            {mainGraphData && showData && <Divider sx={{ mt: '3px', mb: '12px' }} />}
            <div style={{ marginLeft: '8px' }}>
                {showData &&
                    Object.entries(showData).map(([key, value]) => (
                        <FormControlLabel
                            className={classes.checkbox}
                            key={key}
                            label={key === ELEVATION_SRTM ? 'Elevation (Satellite)' : key}
                            control={
                                <Checkbox
                                    sx={{ ml: '-15px', mt: '-4px' }}
                                    checked={checkShowData(value)}
                                    onChange={() => {
                                        let updatedShowData = Object.assign({}, showData);
                                        updatedShowData[key] = !value;
                                        setShowData(updatedShowData);
                                    }}
                                />
                            }
                        ></FormControlLabel>
                    ))}
            </div>
            {mainGraphData && showData && hasData() && (
                <GpxGraph
                    data={mainGraphData?.res}
                    attrGraphData={attrGraphData}
                    showData={showData}
                    xAxis={DISTANCE}
                    y1Axis={[ELEVATION, ELEVATION_SRTM, SLOPE]}
                    y2Axis={SPEED}
                    width={width}
                    minEle={mainGraphData?.minEle}
                    maxEle={mainGraphData?.maxEle}
                    minSpeed={mainGraphData?.minSpeed}
                    maxSpeed={mainGraphData?.maxSpeed}
                    slopes={mainGraphData?.slopes}
                />
            )}
        </>
    );
};

export default GpxGraphProvider;
