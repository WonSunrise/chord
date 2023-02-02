/**
 * WARN: use `handleSeek` of `chord/workbench/parts/player/browser/component/processBar` to handle seeking
 */

'use strict';

import * as React from 'react';

import { ISeekAct } from 'chord/workbench/api/common/action/player';


export function handleSeek(e: React.MouseEvent<HTMLDivElement>, box: HTMLDivElement): ISeekAct {
    let percent: number = e.clientX / box.offsetWidth;
    return {
        type: 'c:player:seek',
        act: 'c:player:seek',
        percent,
    }
}
