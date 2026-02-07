"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ChevronLeft, Image as ImageIcon, MoreHorizontal, HelpCircle, Sparkles } from 'lucide-react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { motion, AnimatePresence } from 'framer-motion';

// Naver Style Toolbar Options
const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image', 'blockquote', 'code-block'],
    ['clean']
];

export default function WriteClient() {
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const quillRef = useRef<Quill | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    // Publish State
    const [selectedTag, setSelectedTag] = useState('잡담');
    const [isLoading, setIsLoading] = useState(false);

    // Tip State
    const [showTip, setShowTip] = useState(true);

    useEffect(() => {
        setMounted(true);
        // Hide tip after 5 seconds
        const timer = setTimeout(() => setShowTip(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Font Configuration
    const fontSizeArr = ['10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '60px', '72px'];
    const fontArr = ['Pretendard', 'Nanum Gothic', 'Nanum Pen Script', 'Gowun Dodum', 'Gowun Batang', 'Gulim'];

    useEffect(() => {
        if (mounted && editorRef.current && !quillRef.current) {
            // Register Font & Size
            const Size = Quill.import('attributors/style/size') as any;
            Size.whitelist = fontSizeArr;
            Quill.register(Size, true);

            const Font = Quill.import('attributors/style/font') as any;
            Font.whitelist = fontArr;
            Quill.register(Font, true);

            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'font': fontArr }, { 'size': fontSizeArr }],
                        ...toolbarOptions
                    ]
                },
                placeholder: '당신의 이야기를 자유롭게 펼쳐보세요...',
            });

            quill.on('text-change', () => {
                setContent(quill.root.innerHTML);
            });

            quillRef.current = quill;
        }
    }, [mounted]);

    // 다크모드 대응 Quill 스타일 (Enhanced)
    useEffect(() => {
        if (!mounted) return;
        const styleId = 'quill-enhanced-styles';
        let styleEl = document.getElementById(styleId);

        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        const accentColor = "#f97316"; // Orange-500

        // Picker Label CSS Generation
        const fontSizeCss = fontSizeArr.map(size =>
            `.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${size}"]::before,
             .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${size}"]::before {
                content: "${size}";
            }`
        ).join('\n');

        const fontCss = fontArr.map(font =>
            `.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font}"]::before,
             .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font}"]::before {
                content: "${font}";
                font-family: "${font}", sans-serif;
            }
             .ql-font-${font.replace(/\s+/g, '-')} {
                font-family: "${font}", sans-serif;
            }`
        ).join('\n');

        // Common styles
        const commonStyles = `
            ${fontSizeCss}
            ${fontCss}
            
            /* Picker Layout Adjustments */
            .ql-snow .ql-picker.ql-size { width: 80px; }
            .ql-snow .ql-picker.ql-font { width: 120px; }

            .ql-toolbar.ql-snow {
                border: none !important;
                padding: 1rem 0 !important;
                position: sticky;
                top: 0;
                z-index: 20;
                transition: all 0.3s ease;
                border-bottom: 1px solid rgba(0,0,0,0.05) !important;
            }
            .ql-container.ql-snow {
                border: none !important;
                font-size: 1.15rem;
                line-height: 1.8;
                font-family: inherit;
            }
            .ql-editor {
                min-height: 50vh;
                padding: 2rem 0;
            }
            .ql-editor.ql-blank::before {
                font-style: normal !important;
                opacity: 0.5;
            }
            /* Customizing Toolbar Icons */
            .ql-snow.ql-toolbar button:hover .ql-stroke, 
            .ql-snow.ql-toolbar button.ql-active .ql-stroke,
            .ql-snow .ql-picker-label:hover .ql-stroke, 
            .ql-snow .ql-picker-label.ql-active .ql-stroke {
                stroke: ${accentColor} !important;
            }
            .ql-snow.ql-toolbar button:hover .ql-fill, 
            .ql-snow.ql-toolbar button.ql-active .ql-fill {
                fill: ${accentColor} !important;
            }
            .ql-snow.ql-toolbar button:hover,
            .ql-snow.ql-toolbar button.ql-active {
                background-color: rgba(249, 115, 22, 0.1) !important;
                border-radius: 8px;
                transform: scale(1.05);
            }
            .ql-toolbar.ql-snow .ql-formats {
                margin-right: 12px !important;
            }
        `;

        if (theme === 'dark') {
            styleEl.innerHTML = `
                ${commonStyles}
                .ql-toolbar.ql-snow {
                    background-color: rgba(0,0,0,0.6);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.08) !important;
                }
                .ql-snow .ql-stroke { stroke: #a1a1aa !important; }
                .ql-snow .ql-fill { fill: #a1a1aa !important; }
                .ql-snow .ql-picker { color: #a1a1aa !important; }
                .ql-editor.ql-blank::before { color: #71717a !important; }
                .ql-editor { color: #e4e4e7; }
            `;
        } else {
            styleEl.innerHTML = `
                ${commonStyles}
                .ql-toolbar.ql-snow {
                    background-color: rgba(255,255,255,0.8);
                    backdrop-filter: blur(12px);
                }
                .ql-editor.ql-blank::before { color: #9ca3af !important; }
            `;
        }

        return () => { };
    }, [theme, mounted]);

    const handlePublish = () => {
        if (!title.trim()) {
            // Shake animation or toast could happen here
            alert('제목을 입력해주세요.');
            return;
        }
        if (quillRef.current && quillRef.current.getText().trim().length === 0 && !content.includes('<img')) {
            alert('내용을 입력해주세요.');
            return;
        }
        setIsPublishModalOpen(true);
    };

    const submitPost = () => {
        setIsLoading(true);
        setTimeout(() => {
            try {
                const savedPosts = localStorage.getItem('dori_community_posts');
                const posts = savedPosts ? JSON.parse(savedPosts) : [];

                const newPost = {
                    id: Date.now().toString(),
                    author: 'Current User',
                    avatar: `https://i.pravatar.cc/40?u=${Date.now()}`,
                    title,
                    content,
                    tags: [selectedTag],
                    likes: 0,
                    comments: 0,
                    createdAt: new Date().toISOString(),
                };

                const updatedPosts = [newPost, ...posts];
                localStorage.setItem('dori_community_posts', JSON.stringify(updatedPosts));

                router.push('/community');
                router.refresh();
            } catch (e) {
                console.error('Failed', e);
                alert('저장에 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    };

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-white dark:bg-black flex flex-col font-sans"
        >
            {/* Elegant Header with Glassmorphism */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="h-16 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between px-6 bg-white/70 dark:bg-black/70 backdrop-blur-xl z-50 sticky top-0 supports-[backdrop-filter]:bg-opacity-60"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                    </motion.button>
                    <AnimatePresence>
                        {title.length > 0 && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-sm font-medium text-neutral-500 w-32 truncate hidden md:block"
                            >
                                {title}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center text-xs text-neutral-400 mr-2">
                        <Sparkles size={14} className="mr-1 text-orange-400" />
                        <span>자동 저장 켜짐</span>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePublish}
                        className="px-5 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full text-sm font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all flex items-center gap-1.5"
                    >
                        <span>발행</span>
                    </motion.button>
                </div>
            </motion.header>

            {/* Main Editor Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 relative">

                {/* Floating Tip Widget */}
                <AnimatePresence>
                    {showTip && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute top-8 -right-48 w-40 bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-xl border border-orange-100 dark:border-orange-900/30 hidden xl:block"
                        >
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                <span className="font-bold text-orange-500">Tip.</span><br />
                                Tab키를 눌러서 도구창으로 이동할 수 있어요!
                            </p>
                            <button
                                onClick={() => setShowTip(false)}
                                className="absolute top-1 right-1 text-neutral-400 hover:text-neutral-600"
                            >
                                ×
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Title Input with Animation */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <input
                        type="text"
                        placeholder="제목을 입력해 주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-4xl md:text-5xl font-extrabold placeholder:text-neutral-200 dark:placeholder:text-zinc-800 bg-transparent border-none outline-none mb-6 text-neutral-900 dark:text-white tracking-tight leading-tight"
                    />
                </motion.div>

                {/* Decorative Divider */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="w-24 h-1.5 bg-orange-500 rounded-full mb-10 opacity-80"
                    style={{ transformOrigin: "left" }}
                />

                {/* Editor Container */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* The styles injected via useEffect will handle the toolbar visuals */}
                    <div ref={editorRef} className="quill-editor-container" />
                </motion.div>
            </main>

            {/* Publish Modal with Fun Animation */}
            <AnimatePresence>
                {isPublishModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsPublishModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 pb-0">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                        📝
                                    </div>
                                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">발행하시겠습니까?</h3>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                        어떤 주제의 글인지 알려주세요!
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['잡담', '질문', '정보', '자랑', '팁', '고민'].map((tag) => (
                                            <motion.button
                                                key={tag}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedTag(tag)}
                                                className={`py-2 px-4 rounded-full text-sm font-bold transition-all ${selectedTag === tag
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-500 ring-offset-2 ring-offset-white dark:ring-offset-black'
                                                    : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-zinc-700'
                                                    }`}
                                            >
                                                {tag}
                                            </motion.button>
                                        ))}
                                    </div>

                                    {/* Preview Card */}
                                    <div className="bg-neutral-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex gap-4 items-center border border-neutral-100 dark:border-zinc-800 mt-4">
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-700 rounded-xl flex items-center justify-center shadow-sm text-2xl flex-shrink-0">
                                            {/* Could be dynamic based on content */}
                                            ✨
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-neutral-900 dark:text-white truncate mb-1">{title || '제목 없는 글'}</h4>
                                            <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                                                <span className="text-orange-500 font-medium">#{selectedTag}</span>
                                                <span>•</span>
                                                <span>방금 전</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex justify-between items-center gap-3 mt-4">
                                <button
                                    onClick={() => setIsPublishModalOpen(false)}
                                    className="px-6 py-3 text-neutral-500 font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                >
                                    취소
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={submitPost}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? '저장 중...' : '게시글 등록하기'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
