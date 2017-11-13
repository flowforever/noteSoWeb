/* global window, document */
import React from 'react';
import ReactDom from 'react-dom';
import $ from 'jquery';
import 'antd/dist/antd.less';
import '../core/styles/helper.scss';
import {Modal} from 'antd';


window.addEventListener("unhandledrejection", function (event, promise) {
    // handle error here, for example log
    Modal.error({
        content: <div>
            请求失败!
        </div>,
    });
});

$(() => {
    ReactDom.render(
        routes,
        document.getElementById('appRoot')
    );
});
