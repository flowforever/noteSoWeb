import $ from 'jquery';

export default {
    getNote(hash) {
        return $.get(`/api/note/getByHash?hash=${hash}`);
    },

    saveNote(noteBody) {
        return $.ajax(`/api/note/saveNote`, {
            dataType: 'json',
            data: JSON.stringify(noteBody),
            type: 'POST',
            contentType: "application/json",
        });
    },
};
