'use strict';

import * as assert from 'assert';
import * as process from 'process';

import { suite, test } from 'mocha';

import { XiamiApi } from 'chord/music/xiami/webApi';

const xiamiApi = new XiamiApi();

const IN_CI = process.env.IN_CI;


suite('music/xiami/XiamiApi', () => {

    /**
     * Net requests have some probability to be fail,
     * so we test these requests at local, missing at CI
    */
    if (IN_CI) return;

    test('makeSign', function() {
        let md5 = xiamiApi.makeSign('node', JSON.stringify({ a: 1 }));
        assert.equal(md5, 'ef729cf52ae6e9b1f88d747efe67eb26');
    });

    test('audios', async function() {
        let id = '1768959568';
        let audios = await xiamiApi.audios(id);
        assert.equal(audios.length > 0, true);
    });

    test('song', async function() {
        let id = '1';
        let song = await xiamiApi.song(id);
        let songOriginalId = song.songOriginalId;
        assert.equal(songOriginalId, id);
    });

    // Login is needed
    test('album', async function() {
        let id = '1';
        let album = await xiamiApi.album(id);
        let originalId = album.albumOriginalId;
        assert.equal(originalId, id);
    });

    test('collection', async function() {
        let id = '254834530';
        let collection = await xiamiApi.collection(id);
        let originalId = collection.collectionOriginalId;
        assert.equal(originalId, id);
    });

    test('collectionSongs', async function() {
        let id = '254834530';
        let songs = await xiamiApi.collectionSongs(id, 1, 5);
        assert.equal(songs.length, 5);
    });

    // Login is needed
    test('artist', async function() {
        let id = '1';
        let artist = await xiamiApi.artist(id);
        assert.equal(artist.artistOriginalId, id);
    });

    test('artistAlbums', async function() {
        let id = '1';
        let albums = await xiamiApi.artistAlbums(id, 1, 1);
        console.log(albums);
        assert.equal(albums.length, 1);
    });

    test('searchSongs', async function() {
        let items = await xiamiApi.searchSongs('linkin', 1, 2);
        assert.equal(items.length, 2);
    });

    test('searchAlbums', async function() {
        let items = await xiamiApi.searchAlbums('linkin', 1, 2);
        assert.equal(items.length, 2);
    });

    test('searchArtists', async function() {
        let items = await xiamiApi.searchArtists('linkin', 1, 2);
        assert.equal(items.length, 2);
    });

    test('searchCollections', async function() {
        let items = await xiamiApi.searchCollections('linkin', 1, 2);
        assert.equal(items.length, 2);
    });
});
