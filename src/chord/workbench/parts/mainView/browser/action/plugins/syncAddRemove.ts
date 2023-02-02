'use strict';

import { Logger } from 'chord/platform/log/common/log';
import { filenameToNodeName } from 'chord/platform/utils/common/paths';
const logger = new Logger(filenameToNodeName(__filename));

import { ok } from 'chord/base/common/assert';

import { getOrigin } from 'chord/music/common/origin';

import { ISong } from 'chord/music/api/song';
import { IArtist } from 'chord/music/api/artist';
import { IAlbum } from 'chord/music/api/album';
import { ICollection } from 'chord/music/api/collection';
import { IUserProfile } from 'chord/music/api/user';

import { IEpisode } from 'chord/sound/api/episode';
import { IPodcast } from 'chord/sound/api/podcast';
import { IRadio } from 'chord/sound/api/radio';

import { musicApi } from 'chord/music/core/api';
// import { soundApi } from 'chord/sound/core/api';

import { IOriginConfiguration } from 'chord/preference/api/user';
import { userConfiguration } from 'chord/preference/configuration/user';


export async function syncAdd(item: ISong | IArtist | IAlbum | ICollection | IUserProfile | IEpisode | IPodcast | IRadio): Promise<boolean> {
    let itemId = item.type == 'userProfile' ? item['userId'] : item[`${item.type}Id`];
    let itemMid = item.type == 'userProfile' ? item['userMid'] : item[`${item.type}Mid`];
    let originType = getOrigin(itemId);
    let config = userConfiguration.getConfig();
    let { account, syncAddRemove }: IOriginConfiguration = config[originType.origin] || {};
    if (account && syncAddRemove) {
        ok(musicApi.logined(originType.origin), '[ERROR] [syncAdd]: user configuration does not synchronize with `musicApi`');

        logger.info('[syncAdd]:', item.type, itemId);

        switch (item.type) {
            case 'song':
                return musicApi.userLikeSong(itemId, itemMid);
            case 'artist':
                return musicApi.userLikeArtist(itemId, itemMid);
            case 'album':
                return musicApi.userLikeAlbum(itemId, itemMid);
            case 'collection':
                return musicApi.userLikeCollection(itemId, itemMid);
            case 'userProfile':
                return musicApi.userLikeUserProfile(itemId, itemMid);

            case 'episode':
                return false;
            // return soundApi.userLikeEpisode(itemId, itemMid);
            case 'podcast':
                return false;
            // return soundApi.userLikePodcast(itemId, itemMid);
            case 'radio':
                return false;
            // return soundApi.userLikeRadio(itemId, itemMid);
            default:
                throw new Error(`[ERROR] [syncAdd] Here will never be occured. [args]: ${JSON.stringify(item)}`);
        }
    } else {
        return false;
    }
}


export async function syncRemove(item: ISong | IArtist | IAlbum | ICollection | IUserProfile | IEpisode | IPodcast | IRadio): Promise<boolean> {
    let itemId = item.type == 'userProfile' ? item['userId'] : item[`${item.type}Id`];
    let itemMid = item.type == 'userProfile' ? item['userMid'] : item[`${item.type}Mid`];
    let originType = getOrigin(itemId);
    let config = userConfiguration.getConfig();
    let { account, syncAddRemove }: IOriginConfiguration = config[originType.origin] || {};
    if (account && syncAddRemove) {
        ok(musicApi.logined(originType.origin), '[ERROR] [syncRemove]: user configuration does not synchronize with `musicApi`');

        logger.info('[syncRemove]:', item.type, itemId);

        switch (item.type) {
            case 'song':
                return musicApi.userDislikeSong(itemId, itemMid);
            case 'artist':
                return musicApi.userDislikeArtist(itemId, itemMid);
            case 'album':
                return musicApi.userDislikeAlbum(itemId, itemMid);
            case 'collection':
                return musicApi.userDislikeCollection(itemId, itemMid);
            case 'userProfile':
                return musicApi.userDislikeUserProfile(itemId, itemMid);

            case 'episode':
                return false;
                // return musicApi.userDislikeEpisode(itemId, itemMid);
            case 'podcast':
                return false;
                // return musicApi.userDislikePodcast(itemId, itemMid);
            case 'radio':
                return false;
                // return musicApi.userDislikeRadio(itemId, itemMid);

            default:
                throw new Error(`[ERROR] [syncRemove] Here will never be occured. [args]: ${JSON.stringify(item)}`);
        }
    } else {
        return false;
    }
}
