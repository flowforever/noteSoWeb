import React from "react";
import {browserHistory, IndexRoute, Route, Router} from "react-router";
import {pageLoader} from "./pages/index";

export const routes = <Router history={browserHistory}>
    <Route path="*" getComponent={pageLoader.getEditorPage}/>
    <Route path={"*/**"} getComponent={pageLoader.getNotFoundPage}/>
</Router>;
