import React from 'react';
import ReactQuill from 'react-quill'; // ES6
import 'react-quill/dist/quill.snow.css'; // ES6

const CustomButton = () => <span className="octicon octicon-star"/>
function insertStar () {
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
        text: ''
    };

    render() {
        return [
            <CustomToolbar key={'toolbar'}/>,
            <ReactQuill
                key={'editor'}
                theme={'snow'}
                value={this.state.text}
                onChange={this.onEdit}
                style={{width: '100%', height: '100%', position: 'fixed'}}
                modules={{
                    toolbar: {
                        container: "#toolbar",
                        handlers: {
                            "insertStar": insertStar,
                        }
                    }
                }}
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
        toolbar: [
            [{'header': '1'}, {'header': '2'}, {'font': []}],
            [{size: []}],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'},
                {'indent': '-1'}, {'indent': '+1'}],
            ['link', 'image', 'video'],
            ['clean']
        ],
        clipboard: {
            // toggle to add extra line breaks when pasting HTML:
            matchVisual: false,
        }
    };

    onEdit = () => {

    }
}
