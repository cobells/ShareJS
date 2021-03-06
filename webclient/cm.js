(function() {
  var applyToShareJS;

  applyToShareJS = function(editorDoc, delta, doc) {
    var delLen, i, startPos;
    startPos = 0;
    i = 0;
    while (i < delta.from.line) {
      startPos += editorDoc.lineInfo(i).text.length + 1;
      i++;
    }
    startPos += delta.from.ch;
    if (delta.to.line === delta.from.line && delta.to.ch === delta.from.ch) {
      doc.insert(startPos, delta.text.join('\n'));
    } else {
      delLen = delta.to.ch - delta.from.ch;
      while (i < delta.to.line) {
        delLen += editorDoc.lineInfo(i).text.length + 1;
        i++;
      }
      doc.del(startPos, delLen);
      if (delta.text) doc.insert(startPos, delta.text.join('\n'));
    }
    if (delta.next) return applyToShareJS(editorDoc, delta.next, doc);
  };

  window.sharejs.extendDoc('attach_cm', function(editor, keepEditorContents) {
    var check, editorListener, sharedoc, suppress;
    if (!this.provides.text) {
      throw new Error('Only text documents can be attached to CodeMirror2');
    }
    sharedoc = this;
    check = function() {
      return window.setTimeout(function() {
        var editorText, otText;
        editorText = editor.getValue();
        otText = sharedoc.getValue();
        if (editorText !== otText) {
          console.error("Text does not match!");
          console.error("editor: " + editorText);
          console.error("ot:     " + otText);
          return editor.setValue(sharedoc.getValue());
        }
      }, 0);
    };
    if (keepEditorContents) {
      this.del(0, sharedoc.getText().length);
      this.insert(0, editor.getValue());
    } else {
      editor.setValue(sharedoc.getText());
    }
    check();
    suppress = false;
    editorListener = function(ed, change) {
      if (suppress) return;
      applyToShareJS(editor, change, sharedoc);
      return check();
    };
    editor.setOption('onChange', editorListener);
    this.on('insert', function(pos, text) {
      suppress = true;
      editor.replaceRange(text, editor.posFromIndex(pos));
      suppress = false;
      return check();
    });
    this.on('delete', function(pos, text) {
      var from, to;
      suppress = true;
      from = editor.posFromIndex(pos);
      to = editor.posFromIndex(pos + text.length);
      editor.replaceRange('', from, to);
      suppress = false;
      return check();
    });
    this.detach_cm = function() {
      editor.setOption('onChange', null);
      return delete this.detach_cm;
    };
  });

}).call(this);
