import React from 'react';
import ReactQuill from 'react-quill'; // ES6
import apis from '../apis';
import 'react-quill/dist/quill.snow.css'; // ES6
import _ from 'lodash';
import shortid from 'shortid';

const CustomButton = () => <span className="octicon octicon-star"/>

function insertStar() {
    const cursorPosition = this.quill.getSelection().index
    this.quill.insertText(cursorPosition, "★")
    this.quill.setSelection(cursorPosition + 1)
}

const CustomToolbar = () => (
    <div id="toolbar">
        <select className="ql-header">
            <option></option>
            <option value="1"></option>
            <option value="2"></option>
        </select>
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-underline"></button>
        <button className="ql-strike"></button>
        <button className="ql-blockquote"></button>
    </div>
);


export default class EditorPage extends React.Component {

    state = {
        content: ''
    };

    componentDidMount() {
        let hash = this.getHash();
        if (hash) {
            this.loadNote(hash);
        } else {
            this.props.router.replace(shortid.generate())
        }
    }

    componentWillReceiveProps(newProps) {
        let oldHash = this.getHash();
        let newHash = this.getHash(newProps);

        if (oldHash !== newHash) {
            this.loadNote(newHash);
        }
    }

    loadNote(hash) {
        if (!hash) {
            return;
        }

        apis.getNote(hash).then(res => {
            this.setState({content: res.content})
        });
    }

    getHash(props = this.props) {
        return decodeURIComponent(props.location.pathname.replace('/', ''));
    }

    render() {
        return [
            <CustomToolbar key={'toolbar'}/>,
            <ReactQuill
                key={'editor'}
                theme={'snow'}
                value={this.state.content}
                onChange={this.onEditorChange}
                style={{width: '100%', height: '100%', position: 'fixed'}}
                modules={this.modules}
                formats={this.formats}
            />
        ]
    }

    formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video'
    ];

    modules = {
        toolbar: {
            container: "#toolbar",
            handlers: {
                "insertStar": insertStar,
            }
        },
        clipboard: {
            // toggle to add extra line breaks when pasting HTML:
            matchVisual: false,
        },

        /*
         ,
        __toolbar: [
            [{'header': '1'}, {'header': '2'}, {'font': []}],
            [{size: []}],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'},
                {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image', 'video'],
            ['clean']
        ]
        */
    };

    onEditorChange = content => {
        if (this.state.content !== content) {
            this.setState({content});
            this.onSave(content);
        }
    };

    onSave = _.debounce((content) => {
        apis.saveNote({
            content,
            hash: this.getHash()
        });
    }, 500);
}
