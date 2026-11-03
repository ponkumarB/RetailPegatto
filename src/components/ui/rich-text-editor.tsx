'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = 'Enter bug description details...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const isInternalChange = useRef(false);
  const [headingVal, setHeadingVal] = useState('Normal');

  // Handle external value updates (initial load)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (selectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(selectionRef.current);
      }
    }
  };

  const handleCommand = (command: string, arg: string = '') => {
    // Focus the editor first to make sure there's active focus
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    
    // Sync React State
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    saveSelection();
  };

  const handleLink = () => {
    saveSelection();
    const url = prompt('Enter the link URL:');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleImage = () => {
    saveSelection();
    const url = prompt('Enter the image URL:');
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Rich Text Toolbar */}
      <div 
        className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl"
        onMouseLeave={saveSelection}
      >
        <div 
          className="h-8 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 cursor-pointer flex items-center justify-center px-1"
          onMouseDown={() => saveSelection()}
        >
          <Select 
            value={headingVal} 
            onValueChange={(val) => {
              if (val) {
                setHeadingVal(val);
                let tag = '<p>';
                if (val === 'Heading 1') tag = '<h1>';
                else if (val === 'Heading 2') tag = '<h2>';
                handleCommand('formatBlock', tag);
              }
            }}
          >
            <SelectTrigger className="h-7 w-20 border-0 bg-transparent text-[11px] font-bold py-0 pr-1 select-none focus:ring-0 focus:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Heading 1">Heading 1</SelectItem>
              <SelectItem value="Heading 2">Heading 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('bold');
          }}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('italic');
          }}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('underline');
          }}
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('strikeThrough');
          }}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('insertUnorderedList');
          }}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('insertOrderedList');
          }}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('justifyLeft');
          }}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('justifyCenter');
          }}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('justifyRight');
          }}
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleImage();
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('formatBlock', '<pre>');
          }}
        >
          <Code className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommand('formatBlock', '<blockquote>');
          }}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className="w-full min-h-[120px] max-h-[300px] overflow-y-auto text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-350 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-900 [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:text-[11px]"
        data-placeholder={placeholder}
        style={{ outline: 'none' }}
      />
    </div>
  );
}
