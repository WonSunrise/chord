'use strict';

import { ISearchViewAct } from 'chord/workbench/api/common/action/mainView';


export interface INavigationSearchProps {
    view: string;
    search: () => ISearchViewAct;
}
