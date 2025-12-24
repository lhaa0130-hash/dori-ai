"use client";

import { useRef, useEffect, useState } from "react";

// Quill을 직접 사용 (React 19 호환)
let Quill: any = null;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "내용을 입력하세요..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 Quill 로드
    if (typeof window !== 'undefined' && !Quill) {
      import('quill').then((module) => {
        Quill = module.default;
        import('quill/dist/quill.snow.css');
        setIsMounted(true);
      });
    } else if (Quill) {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || !editorRef.current || !Quill || quillRef.current) return;

    // Quill 에디터 초기화
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video'],
            ['clean']
          ],
          handlers: {
            image: function() {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();
              
              input.onchange = async () => {
                const file = input.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    if (quill && e.target?.result) {
                      const range = quill.getSelection(true);
                      quill.insertEmbed(range.index, 'image', e.target.result, 'user');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
            },
            video: function() {
              const url = prompt('비디오 URL을 입력하세요 (YouTube, Vimeo 등):');
              if (url && quill) {
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'video', url, 'user');
              }
            }
          }
        },
        clipboard: {
          matchVisual: false,
        }
      },
      formats: [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'indent',
        'align',
        'blockquote', 'code-block',
        'link', 'image', 'video'
      ]
    });

    quillRef.current = quill;

    // 초기 값 설정
    if (value) {
      quill.root.innerHTML = value;
    }

    // 내용 변경 감지
    const handleTextChange = () => {
      const html = quill.root.innerHTML;
      if (html !== value) {
        onChange(html);
      }
    };

    quill.on('text-change', handleTextChange);

    // 드래그 앤 드롭 핸들러 추가 (Quill 에디터 영역에)
    const editorElement = quill.root;
    const containerElement = editorRef.current;
    
    if (editorElement && containerElement) {
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        containerElement.style.opacity = '0.8';
      };

      const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        containerElement.style.opacity = '1';
      };

      const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        containerElement.style.opacity = '1';

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            // 이미지 파일 처리
            const reader = new FileReader();
            reader.onload = (event) => {
              if (quill && event.target?.result) {
                const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
                quill.insertEmbed(range.index, 'image', event.target.result, 'user');
                quill.setSelection(range.index + 1);
              }
            };
            reader.readAsDataURL(file);
          } else if (file.type.startsWith('video/')) {
            // 비디오 파일 처리
            const reader = new FileReader();
            reader.onload = (event) => {
              if (quill && event.target?.result) {
                const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
                quill.insertEmbed(range.index, 'video', event.target.result, 'user');
                quill.setSelection(range.index + 1);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      };

      editorElement.addEventListener('dragover', handleDragOver);
      editorElement.addEventListener('dragleave', handleDragLeave);
      editorElement.addEventListener('drop', handleDrop);

      return () => {
        quill.off('text-change', handleTextChange);
        if (editorElement) {
          editorElement.removeEventListener('dragover', handleDragOver);
          editorElement.removeEventListener('dragleave', handleDragLeave);
          editorElement.removeEventListener('drop', handleDrop);
        }
        if (quillRef.current) {
          quillRef.current = null;
        }
      };
    }

    return () => {
      quill.off('text-change', handleTextChange);
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, placeholder]);

  // 외부에서 value가 변경되면 에디터 업데이트
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = value;
      if (selection) {
        setTimeout(() => {
          quillRef.current?.setSelection(selection);
        }, 0);
      }
    }
  }, [value]);

  if (!isMounted) {
    return (
      <div className="rich-text-editor-loading" style={{
        padding: '20px',
        textAlign: 'center',
        background: 'var(--bg-soft)',
        borderRadius: '8px',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-sub)'
      }}>
        에디터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      {/* 도움말 */}
      <div className="editor-help" style={{ 
        padding: '8px 12px', 
        background: 'var(--bg-soft)', 
        borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid var(--card-border)',
        fontSize: '12px',
        color: 'var(--text-sub)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        <strong>💡 사용법:</strong> 텍스트 선택 후 툴바에서 폰트 크기(H1~H6), 폰트 종류, 색상, 굵기 등을 설정할 수 있습니다. 이미지와 비디오 파일을 드래그 앤 드롭으로 직접 올릴 수 있습니다!
      </div>
      <div 
        ref={editorRef}
        style={{
          backgroundColor: 'var(--bg-soft)',
          borderRadius: '0 0 8px 8px',
          minHeight: '400px'
        }}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 16px;
          min-height: 400px;
          background: var(--bg-soft);
          color: var(--text-main);
        }
        .rich-text-editor .ql-editor {
          min-height: 400px;
        }
        .rich-text-editor .ql-toolbar {
          background: var(--bg-soft);
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: 1px solid var(--card-border);
        }
        .rich-text-editor .ql-toolbar button {
          color: var(--text-main);
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #00baff;
        }
        .rich-text-editor .ql-stroke {
          stroke: var(--text-main);
        }
        .rich-text-editor .ql-fill {
          fill: var(--text-main);
        }
        .rich-text-editor .ql-picker-label {
          color: var(--text-main);
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #999;
          font-style: normal;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 10px 0;
        }
        .rich-text-editor .ql-editor iframe {
          max-width: 100%;
          border-radius: 8px;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
}

