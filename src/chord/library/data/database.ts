'use strict';

import { removeEmtryAttributes } from 'chord/base/common/objects';

import { jsonDumpValue } from 'chord/base/common/json';

import { Database } from 'better-sqlite3';
import * as Sqlite from 'better-sqlite3';

import { ISong } from 'chord/music/api/song';
import { IAlbum } from 'chord/music/api/album';
import { IArtist } from 'chord/music/api/artist';
import { ICollection } from 'chord/music/api/collection';
import { IUserProfile } from "chord/music/api/user";
import { IAudio } from 'chord/music/api/audio';

import { ILibrarySong } from 'chord/library/api/song';
import { ILibraryAlbum } from 'chord/library/api/album';
import { ILibraryArtist } from 'chord/library/api/artist';
import { ILibraryCollection } from 'chord/library/api/collection';
import { ILibraryUserProfile } from 'chord/library/api/userProfile';

import { IEpisode } from 'chord/sound/api/episode';
import { IPodcast } from 'chord/sound/api/podcast';
import { IRadio } from 'chord/sound/api/radio';

import { ILibraryEpisode } from 'chord/library/api/episode';
import { ILibraryPodcast } from 'chord/library/api/podcast';
import { ILibraryRadio } from 'chord/library/api/radio';

import {
    toNumber,
    makeAudio,
    makeSong,
    makeAlbum,
    makeArtist,
    makeCollection,
    makeUserProfile,

    makeEpisode,
    makePodcast,
    makeRadio,
} from 'chord/library/data/parser';

import { TABLES } from 'chord/library/data/common';


export class LibraryDatabase {

    databasePath: string;
    private db: Database;

    constructor(databasePath: string) {
        this.db = new Sqlite(databasePath);
    }

    public getDatabase(): Database {
        return this.db;
    }

    public getEncryptedPassword(): string {
        let sql = 'SELECT encrypted_password FROM user';
        let result = this.db.prepare(sql).get();
        return result['encrypted_password'];
    }

    public audio(songId: string): Array<any> {
        let sql = 'SELECT * FROM audio WHERE songId = ?';
        return this.db.prepare(sql).all(songId)
            .map(row => makeAudio(row));
    }

    public songs(songIds: Array<string>): Array<ISong> {
        let param = '?,'.repeat(songIds.length).slice(0, -1);
        let sql = `SELECT * FROM song WHERE songId IN (${param})`;
        return this.db.prepare(sql).all(songIds)
            .map(row => makeSong(row))
            .map(song => {
                song.audios = this.audio(song.songId);
                return <ISong>song;
            });
    }

    protected libraryItem(sql: string, lastId: number, size: number, keyword?: string): Array<any> {
        if (keyword) {
            let kw = `%${keyword}%`;
            return this.db.prepare(sql).all({ lastId, kw, size });
        } else {
            return this.db.prepare(sql).all({ lastId, size });
        }
    }

    public librarySongs(lastId: number, size: number, keyword?: string): Array<ILibrarySong> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((song.songName like @kw) OR (song.subTitle like @kw) OR (song.albumName like @kw) OR (song.artistName like @kw) OR (song.genres like @kw))';
        }
        let sql = `SELECT song.*, library_song.* FROM library_song INNER JOIN song ON library_song.songId = song.songId WHERE library_song.id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY library_song.id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let song = makeSong(row);
                song.audios = this.audio(song.songId);
                return { id, addAt, song };
            });
    }

    public libraryAlbums(lastId: number, size: number, keyword?: string): Array<ILibraryAlbum> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((subTitle like @kw) OR (albumName like @kw) OR (artistName like @kw) OR (genres like @kw))';
        }
        let sql = `SELECT * FROM library_album WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let album = makeAlbum(row);
                return { id, addAt, album };
            });
    }

    public libraryAlbumSongs(albumId: string): Array<ISong> {
        let sql = `SELECT * FROM library_album WHERE albumId = ?`;
        let row = this.db.prepare(sql).get(albumId);
        if (row) {
            return this.songs(JSON.parse(row.songs).map(row => { delete row.id; return row }));
        } else {
            return [];
        }
    }

    public libraryArtists(lastId: number, size: number, keyword?: string): Array<ILibraryArtist> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((artistName like @kw) OR (genres like @kw))';
        }
        let sql = `SELECT * FROM library_artist WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let artist = makeArtist(row);
                return { id, addAt, artist };
            });
    }

    public libraryCollections(lastId: number, size: number, keyword?: string): Array<ILibraryCollection> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((collectionName like @kw) OR (tags like @kw))';
        }
        let sql = `SELECT * FROM library_collection WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let collection = makeCollection(row);
                return { id, addAt, collection };
            });
    }

    public libraryCollectionSongs(collectionId: string): Array<ISong> {
        let sql = 'SELECT * FROM library_collection WHERE collectionId = ?';
        let row = this.db.prepare(sql).get(collectionId);
        if (row) {
            return this.songs(JSON.parse(row.songs).map(row => { delete row.id; return row }));
        } else {
            return [];
        }
    }

    public libraryUserProfiles(lastId: number, size: number, keyword?: string): Array<ILibraryUserProfile> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '(userName like @kw)';
        }
        let sql = `SELECT * FROM library_user_profile WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let userProfile = makeUserProfile(row);
                return { id, addAt, userProfile };
            });
    }

    public episodes(episodeIds: Array<string>): Array<IEpisode> {
        let param = '?,'.repeat(episodeIds.length).slice(0, -1);
        let sql = `SELECT * FROM episode WHERE episodeId IN (${param})`;
        return this.db.prepare(sql).all(episodeIds)
            .map(row => makeEpisode(row))
            .map(episode => {
                episode.audios = this.audio(episode.episodeId);
                return <IEpisode>episode;
            });
    }

    public libraryEpisodes(lastId: number, size: number, keyword?: string): Array<ILibraryEpisode> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((episode.episodeName like @kw) OR (episode.subTitle like @kw) OR (episode.podcastName like @kw) OR (episode.radioName like @kw) OR (episode.genres like @kw))';
        }
        let sql = `SELECT episode.*, library_episode.* FROM library_episode INNER JOIN episode ON library_episode.episodeId = episode.episodeId WHERE library_episode.id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY library_episode.id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let episode = makeEpisode(row);
                episode.audios = this.audio(episode.episodeId);
                return { id, addAt, episode };
            });
    }

    public libraryPodcasts(lastId: number, size: number, keyword?: string): Array<ILibraryPodcast> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '((subTitle like @kw) OR (podcastName like @kw) OR (radioName like @kw) OR (genres like @kw))';
        }
        let sql = `SELECT * FROM library_podcast WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let podcast = makePodcast(row);
                return { id, addAt, podcast };
            });
    }

    public libraryPodcastEpisodes(podcastId: string): Array<IEpisode> {
        let sql = `SELECT * FROM library_podcast WHERE podcastId = ?`;
        let row = this.db.prepare(sql).get(podcastId);
        if (row) {
            return this.episodes(JSON.parse(row.episodes).map(row => { delete row.id; return row }));
        } else {
            return [];
        }
    }

    public libraryRadios(lastId: number, size: number, keyword?: string): Array<ILibraryRadio> {
        let searchCondition = '';
        if (keyword) {
            searchCondition = '(radioName like @kw)';
        }
        let sql = `SELECT * FROM library_radio WHERE id < @lastId ${keyword ? 'AND ' + searchCondition : ''} ORDER BY id DESC LIMIT @size`;
        return this.libraryItem(sql, lastId, size, keyword)
            .map(row => {
                let addAt = row.addAt;
                let id = row.id;
                delete row.id;
                delete row.addAt;

                let radio = makeRadio(row);
                return { id, addAt, radio };
            });
    }

    public storeAudio(audio: IAudio, songId: string): boolean {
        let _audio = <any>{ ...audio };
        _audio.songId = songId;

        let columns = Object.keys(_audio);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO audio (${columnsStr}) values (${param})`;
        this.db.prepare(sql).run(_audio);
        return true;
    }

    // XXX: NO use this
    public addUser(username: string, encrypted_password: string): boolean {
        let sql = `insert or ignore into user (username, encrypted_password) values (?, ?)`
        this.db.prepare(sql).run(username, encrypted_password);
        return true;
    }

    public storeSong(song: ISong, addAt: number): boolean {
        // First, store audios
        song.audios.map(audio => this.storeAudio(audio, song.songId));

        let _song = <any>{ ...song };
        delete _song.audios;

        removeEmtryAttributes(_song);
        toNumber(_song);

        jsonDumpValue(_song);

        let columns = Object.keys(_song);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO song (${columnsStr}) VALUES (${param})`;
        this.db.prepare(sql).run(_song);
        return true;
    }

    public addSong(song: ISong, addAt: number): ILibrarySong {
        this.storeSong(song, addAt);

        let param = { addAt, songId: song.songId };

        let sql = 'INSERT OR IGNORE INTO library_song (songId, addAt) VALUES (@songId, @addAt)';
        let result = this.db.prepare(sql).run(param);

        return { id: <number>result.lastInsertRowid, song, addAt };
    }

    public addAlbum(album: IAlbum, addAt: number): ILibraryAlbum {
        // First add song;
        album.songs.map(song => this.storeSong(song, addAt));

        let _album = <any>{ ...album };
        _album.songs = album.songs.map(song => song.songId);

        removeEmtryAttributes(_album);
        toNumber(_album);

        jsonDumpValue(_album);

        _album.addAt = addAt;

        let columns = Object.keys(_album);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_album (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_album);

        return { id: <number>result.lastInsertRowid, album, addAt };
    }

    public addArtist(artist: IArtist, addAt: number): ILibraryArtist {
        let _artist = <any>{ ...artist };
        delete _artist.songs;
        delete _artist.albums;

        removeEmtryAttributes(_artist);
        toNumber(_artist);

        jsonDumpValue(_artist);

        _artist.addAt = addAt;

        let columns = Object.keys(_artist);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_artist (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_artist);

        return { id: <number>result.lastInsertRowid, artist, addAt };
    }

    public addCollection(collection: ICollection, addAt: number): ILibraryCollection {
        // First add song;
        collection.songs.map(song => this.storeSong(song, addAt));

        let _collection = <any>{ ...collection };
        _collection.songs = collection.songs.map(song => song.songId);

        removeEmtryAttributes(_collection);
        toNumber(_collection);

        jsonDumpValue(_collection);

        _collection.addAt = addAt;

        let columns = Object.keys(_collection);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_collection (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_collection);

        return { id: <number>result.lastInsertRowid, collection, addAt };
    }

    public addUserProfile(userProfile: IUserProfile, addAt: number): ILibraryUserProfile {
        let _userProfile = <any>{ ...userProfile };
        delete _userProfile.songs;
        delete _userProfile.artists;
        delete _userProfile.albums;
        delete _userProfile.favoriteCollections;
        delete _userProfile.createdCollections;
        delete _userProfile.followings;
        delete _userProfile.followers;

        removeEmtryAttributes(_userProfile);
        toNumber(_userProfile);

        jsonDumpValue(_userProfile);

        _userProfile.addAt = addAt;

        let columns = Object.keys(_userProfile);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_user_profile (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_userProfile);

        return { id: <number>result.lastInsertRowid, userProfile, addAt };
    }


    public storeEpisode(episode: IEpisode, addAt: number): boolean {
        // First, store audios
        episode.audios.map(audio => this.storeAudio(audio, episode.episodeId));

        let _episode = <any>{ ...episode };
        delete _episode.audios;

        removeEmtryAttributes(_episode);
        toNumber(_episode);

        jsonDumpValue(_episode);

        let columns = Object.keys(_episode);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO episode (${columnsStr}) VALUES (${param})`;
        this.db.prepare(sql).run(_episode);
        return true;
    }

    public addEpisode(episode: IEpisode, addAt: number): ILibraryEpisode {
        this.storeEpisode(episode, addAt);

        let param = { addAt, episodeId: episode.episodeId };

        let sql = 'INSERT OR IGNORE INTO library_episode (episodeId, addAt) VALUES (@episodeId, @addAt)';
        let result = this.db.prepare(sql).run(param);

        return { id: <number>result.lastInsertRowid, episode, addAt };
    }

    public addPodcast(podcast: IPodcast, addAt: number): ILibraryPodcast {
        // First add episode;
        podcast.episodes.map(episode => this.storeEpisode(episode, addAt));

        let _podcast = <any>{ ...podcast };
        _podcast.episodes = podcast.episodes.map(episode => episode.episodeId);

        removeEmtryAttributes(_podcast);
        toNumber(_podcast);

        jsonDumpValue(_podcast);

        _podcast.addAt = addAt;

        let columns = Object.keys(_podcast);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_podcast (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_podcast);

        return { id: <number>result.lastInsertRowid, podcast, addAt };
    }

    public addRadio(radio: IRadio, addAt: number): ILibraryRadio {
        let _radio = <any>{ ...radio };
        delete _radio.episodes;
        delete _radio.radios;
        delete _radio.podcasts;
        delete _radio.favoritePodcasts;
        delete _radio.followings;
        delete _radio.followers;

        removeEmtryAttributes(_radio);
        toNumber(_radio);

        jsonDumpValue(_radio);

        _radio.addAt = addAt;

        let columns = Object.keys(_radio);
        let columnsStr = columns.join(',')
        let param = columns.map(c => '@' + c).join(',');
        let sql = `INSERT OR IGNORE INTO library_radio (${columnsStr}) VALUES (${param})`;
        let result = this.db.prepare(sql).run(_radio);

        return { id: <number>result.lastInsertRowid, radio, addAt };
    }

    public removeSong(song: ISong): boolean {
        let sql = `DELETE FROM song WHERE songId = @songId AND songId NOT IN (SELECT songId FROM library_song WHERE songId = @songId)`;
        this.db.prepare(sql).run({ songId: song.songId });
        return true;
    }

    public deleteSong(song: ISong): boolean {
        let sql = `DELETE FROM library_song WHERE songId = ?`;
        this.db.prepare(sql).run(song.songId);

        // WARN: no remove song from `song` table, that song may be need by album or collection
        // this.removeSong(song);
        return true;
    }

    public deleteAlbum(album: IAlbum): boolean {
        let sql = `DELETE FROM library_album WHERE albumId = ?`;
        this.db.prepare(sql).run(album.albumId);

        album.songs.forEach(song => this.removeSong(song));
        return true;
    }

    public deleteArtist(artist: IArtist): boolean {
        let sql = `DELETE FROM library_artist WHERE artistId = ?`;
        this.db.prepare(sql).run(artist.artistId);
        return true;
    }

    public deleteCollection(collection: ICollection): boolean {
        let sql = `DELETE FROM library_collection WHERE collectionId = ?`;
        this.db.prepare(sql).run(collection.collectionId);

        collection.songs.forEach(song => this.removeSong(song));
        return true;
    }

    public deleteUserProfile(userProfile: IUserProfile): boolean {
        let sql = `DELETE FROM library_user_profile WHERE userId = ?`;
        this.db.prepare(sql).run(userProfile.userId);
        return true;
    }

    public removeEpisode(episode: IEpisode): boolean {
        let sql = `DELETE FROM episode WHERE episodeId = @episodeId AND episodeId NOT IN (SELECT episodeId FROM library_episode WHERE episodeId = @episodeId)`;
        this.db.prepare(sql).run({ episodeId: episode.episodeId });
        return true;
    }

    public deleteEpisode(episode: IEpisode): boolean {
        let sql = `DELETE FROM library_episode WHERE episodeId = ?`;
        this.db.prepare(sql).run(episode.episodeId);

        // WARN: no remove episode from `episode` table, that episode may be need by podcast or collection
        // this.removeEpisode(episode);
        return true;
    }

    public deletePodcast(podcast: IPodcast): boolean {
        let sql = `DELETE FROM library_podcast WHERE podcastId = ?`;
        this.db.prepare(sql).run(podcast.podcastId);

        podcast.episodes.forEach(episode => this.removeEpisode(episode));
        return true;
    }

    public deleteRadio(radio: IRadio): boolean {
        let sql = `DELETE FROM library_radio WHERE radioId = ?`;
        this.db.prepare(sql).run(radio.radioId);
        return true;
    }

    public exists(item: ISong | IArtist | IAlbum | ICollection | IUserProfile | IEpisode | IPodcast | IRadio): boolean {
        let idName = item.type == 'userProfile' ? 'userId' : `${item.type}Id`;

        if (!TABLES[item.type]) return false;

        let sql = `select 'id' from ${TABLES[item.type]} where ${idName} = ?`;
        let result = this.db.prepare(sql).get(item[idName]);
        return !!result;
    }
}
