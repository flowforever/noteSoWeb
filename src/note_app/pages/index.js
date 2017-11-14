/** Please dont update this file.*/

export const pageLoader = {};

export const getEditorPage = pageLoader.getEditorPage= ()=> import("./EditorPage" /* webpackChunkName: "note/pages/EditorPage" */).then(mod=> mod["default"]);

export const getNotFoundPage = pageLoader.getNotFoundPage= ()=> import("./NotFoundPage" /* webpackChunkName: "note/pages/NotFoundPage" */).then(mod=> mod["default"]);

export const getPageByName = (name)=> pageLoader["get"+name]();