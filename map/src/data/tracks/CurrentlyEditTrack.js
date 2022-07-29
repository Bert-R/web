export default class CurrentlyEditTrack {

    state = {
        newRouteLayer: null,
        pointsList: [],
        trackName: null,
        distance: 0,
        startDraw: false,
        deleteTrack: false,
        deletePoint: -1,
        prepareMap: false
    };

    getState() {
        return this.state;
    }
}