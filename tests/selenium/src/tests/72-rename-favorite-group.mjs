import actionOpenMap from '../actions/actionOpenMap.mjs';
import actionLogIn from '../actions/actionLogIn.mjs';
import { deleteFavGroup, getFiles, uploadFavorites } from '../util.mjs';
import { clickBy, waitBy } from '../lib.mjs';
import { By } from 'selenium-webdriver';
import actionFinish from '../actions/actionFinish.mjs';
import actionRenameFavGroup from '../actions/actionRenameFavGroup.mjs';
import actionOpenFavorites from '../actions/actionOpenFavorites.mjs';

export default async function test() {
    await actionOpenMap();
    await actionLogIn();

    const favGroupName = 'favorites-shops';
    const shortFavGroupName = 'shops';
    const suffix = '-renamed';

    const favorites = getFiles({ folder: 'favorites' });
    const { path } = favorites.find((t) => t.name === favGroupName);

    await actionOpenFavorites();

    // delete old group when need
    const exist = await waitBy(By.id(`se-menu-fav-${shortFavGroupName}`), { optional: true, idle: true });
    if (!exist) {
        // create folder
        await clickBy(By.id('se-import-fav-group'));
        await uploadFavorites({ files: path });
        await waitBy(By.id(`se-menu-fav-${shortFavGroupName}`));
    }

    // delete duplicate old group when need
    const existDuplicate = await waitBy(By.id(`se-menu-fav-${shortFavGroupName}${suffix}`), {
        optional: true,
        idle: true,
    });
    if (existDuplicate) {
        await deleteFavGroup(`${shortFavGroupName}${suffix}`);
    }

    //rename folder
    await actionRenameFavGroup(shortFavGroupName, suffix);

    // check error "Favorite group already exists"
    await clickBy(By.id(`se-folder-actions-button-${shortFavGroupName}${suffix}`));
    await waitBy(By.id('se-favorite-folder-actions'));
    await clickBy(By.id('se-folder-actions-rename'));
    await waitBy(By.id('se-rename-fav-dialog'));
    await clickBy(By.id('se-rename-fav-submit'));
    await waitBy(By.id('se-rename-fav-input-helper-text'));

    await clickBy(By.id('se-rename-fav-cancel'));

    await deleteFavGroup(`${shortFavGroupName}${suffix}`);
    await waitBy(By.id('se-empty-page'));

    await actionFinish();
}
