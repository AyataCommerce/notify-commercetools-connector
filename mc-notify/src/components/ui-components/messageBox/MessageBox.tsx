import { useState, useRef, useEffect } from 'react';
import styles from './MessageBox.module.css';
import { flattenObject, generateMessage } from '../../../utils/messageTemplate.utils';
import addIconWhite from '../../../assets/icons/add-white.svg';
import previewIcon from '../../../assets/icons/preview_icon_white.svg';
import hidePreviewIcon from '../../../assets/icons/eye-hide.svg';
interface MessageBoxProps {
    selectedTemplateData: any;
    messageBody: string;
    placeholder: string;
    title: string;
    onMessageChange: (value: string) => void;
}

const MessageBox = ({ selectedTemplateData, messageBody, placeholder, title, onMessageChange }: MessageBoxProps) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
    const [currentContext, setCurrentContext] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [preview, setPreview] = useState(false);
    const [previewMessage, setPreviewMessage] = useState('')
    // Flatten the template data for suggestions
    useEffect(() => {
        if (selectedTemplateData && Object.keys(selectedTemplateData).length > 0) {
            const paths = flattenObject(selectedTemplateData);
            setSuggestions(paths);
        }
    }, [selectedTemplateData]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        onMessageChange(value);

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);

        // Find the nearest placeholder boundaries around the cursor
        const lastOpenBeforeCursor = textBeforeCursor.lastIndexOf('{{');
        const lastCloseBeforeCursor = textBeforeCursor.lastIndexOf('}}');
        const nextCloseAfterCursor = textAfterCursor.indexOf('}}');
        const nextOpenAfterCursor = textAfterCursor.indexOf('{{');

        // Check if cursor is inside a placeholder (between {{ and }})
        const isInsidePlaceholder = (
            lastOpenBeforeCursor > lastCloseBeforeCursor &&
            (nextCloseAfterCursor >= 0 && (nextOpenAfterCursor === -1 || nextCloseAfterCursor < nextOpenAfterCursor))
        );

        if (isInsidePlaceholder) {
            // Extract the full placeholder content including the braces
            const placeholderStart = lastOpenBeforeCursor;
            const placeholderEnd = cursorPos + nextCloseAfterCursor + 2;
            const placeholderContent = value.substring(placeholderStart + 2, placeholderEnd - 2).trim();

            setCurrentContext(placeholderContent);

            const lastDotPos = placeholderContent.lastIndexOf('.');
            const searchTerm = lastDotPos >= 0
                ? placeholderContent.substring(lastDotPos + 1)
                : placeholderContent;

            const contextPath = lastDotPos >= 0
                ? placeholderContent.substring(0, lastDotPos)
                : '';

            let contextData = selectedTemplateData;
            if (contextPath) {
                try {
                    const pathSegments = contextPath.split('.');
                    for (const segment of pathSegments) {
                        const arrayMatch = segment.match(/(.*)\[(\*|\d+)\]/);
                        if (arrayMatch) {
                            const [, key, index] = arrayMatch;
                            contextData = contextData[key];
                            if (Array.isArray(contextData)) {
                                if (index === '*') {
                                    contextData = contextData[0];
                                } else {
                                    contextData = contextData[parseInt(index, 10)];
                                }
                            }
                        } else {
                            contextData = contextData[segment];
                        }
                        if (!contextData) break;
                    }
                } catch (error) {
                    console.warn('Error navigating to context path:', error);
                    contextData = null;
                }
            }

            const matchingSuggestions = contextData
                ? flattenObject(contextData, contextPath)
                    .filter(path => path.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(path => path.startsWith(contextPath + '.')
                        ? path.substring(contextPath.length + 1)
                        : path)
                : suggestions.filter(path =>
                    path.toLowerCase().includes(placeholderContent.toLowerCase())
                );

            if (matchingSuggestions.length > 0 && textareaRef.current) {
                const textarea = textareaRef.current;
                const lines = textBeforeCursor.split('\n');
                const currentLine = lines[lines.length - 1];

                // Calculate position right after the opening {{
                const top = textarea.offsetTop + (lines.length * 20) + 30;

                // Create temporary span for accurate width measurement
                const tempSpan = document.createElement('span');
                tempSpan.textContent = textBeforeCursor.substring(0, lastOpenBeforeCursor);
                tempSpan.style.whiteSpace = 'pre';
                tempSpan.style.visibility = 'hidden';
                document.body.appendChild(tempSpan);
                const left = textarea.offsetLeft + tempSpan.offsetWidth + 16;
                document.body.removeChild(tempSpan);

                setSuggestionPosition({ top, left });
                setSuggestions(matchingSuggestions);
                setShowSuggestions(true);
                setActiveSuggestion(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const cursorPos = textarea.selectionStart;
        const value = messageBody;
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);

        // Find the placeholder boundaries
        const lastOpenBeforeCursor = textBeforeCursor.lastIndexOf('{{');
        const lastCloseBeforeCursor = textBeforeCursor.lastIndexOf('}}');
        const nextCloseAfterCursor = textAfterCursor.indexOf('}}');

        // Only proceed if we're inside a placeholder
        if (lastOpenBeforeCursor > lastCloseBeforeCursor && nextCloseAfterCursor >= 0) {
            const placeholderStart = lastOpenBeforeCursor;
            const placeholderEnd = cursorPos + nextCloseAfterCursor + 2;
            const placeholderContent = value.substring(placeholderStart + 2, placeholderEnd - 2).trim();

            const lastDotPos = placeholderContent.lastIndexOf('.');
            const contextPath = lastDotPos >= 0 ? placeholderContent.substring(0, lastDotPos) : '';

            const fullPath = contextPath ? `${contextPath}.${placeholder}` : placeholder;

            const newText =
                value.substring(0, placeholderStart) +
                `{{${fullPath}}}` +
                value.substring(placeholderEnd);

            onMessageChange(newText);

            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = placeholderStart + fullPath.length + 4;
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    textareaRef.current.focus();
                }
            }, 10);
        }

        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertPlaceholder(suggestions[activeSuggestion]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const handleVarButtonClick = () => {

        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const currentValue = messageBody;

        // Check if we're inside an existing placeholder
        const textBeforeCursor = currentValue.substring(0, startPos);
        const textAfterCursor = currentValue.substring(endPos);
        const lastOpenBeforeCursor = textBeforeCursor.lastIndexOf('{{');
        const lastCloseBeforeCursor = textBeforeCursor.lastIndexOf('}}');
        const nextCloseAfterCursor = textAfterCursor.indexOf('}}');

        const isInsidePlaceholder = (
            lastOpenBeforeCursor > lastCloseBeforeCursor &&
            (nextCloseAfterCursor >= 0)
        );

        if (isInsidePlaceholder) {
            // If inside a placeholder, just show suggestions
            const placeholderStart = lastOpenBeforeCursor;
            const placeholderContent = currentValue.substring(placeholderStart + 2, startPos + nextCloseAfterCursor).trim();
            setCurrentContext(placeholderContent);

            // Calculate position
            const lines = textBeforeCursor.split('\n');
            const top = textarea.offsetTop + (lines.length * 20) + 30;

            const tempSpan = document.createElement('span');
            tempSpan.textContent = textBeforeCursor.substring(0, lastOpenBeforeCursor);
            tempSpan.style.whiteSpace = 'pre';
            tempSpan.style.visibility = 'hidden';
            document.body.appendChild(tempSpan);
            const left = textarea.offsetLeft + tempSpan.offsetWidth + 16;
            document.body.removeChild(tempSpan);

            setSuggestionPosition({ top, left });
            setShowSuggestions(true);
            setActiveSuggestion(0);
        } else {
            // If not inside a placeholder, insert new {{}} and show suggestions
            const newValue =
                currentValue.substring(0, startPos) +
                '{{}}' +
                currentValue.substring(endPos);

            onMessageChange(newValue);

            // Use a slightly longer timeout to ensure DOM updates
            setTimeout(() => {
                if (!textareaRef.current) return;

                const newCursorPos = startPos + 2;
                textareaRef.current.selectionStart = newCursorPos;
                textareaRef.current.selectionEnd = newCursorPos;
                textareaRef.current.focus();

                // Calculate position for the new {{}}
                const newTextBeforeCursor = newValue.substring(0, newCursorPos);
                const lines = newTextBeforeCursor.split('\n');
                const top = textarea.offsetTop + (lines.length * 20) + 30;

                const tempSpan = document.createElement('span');
                tempSpan.textContent = newTextBeforeCursor;
                tempSpan.style.whiteSpace = 'pre';
                tempSpan.style.visibility = 'hidden';
                document.body.appendChild(tempSpan);
                const left = textarea.offsetLeft + tempSpan.offsetWidth;
                document.body.removeChild(tempSpan);

                setSuggestionPosition({ top, left });
                setCurrentContext('');
                setShowSuggestions(true);
                setActiveSuggestion(0);
            }, 50); // Increased delay to ensure DOM updates
        }
    };

    const handlePreviewButtonClick = (preview: boolean) => {
        setPreview(!preview);
        const previewMessage = generateMessage(selectedTemplateData, messageBody)
        setPreviewMessage(previewMessage);
    }

    return (
        <div className={styles.messageBoxContainer}>
            <label className={styles.label}>{title}</label>
            <div className={styles.editorContainer}>
                <div className={styles.messageEditorBox}>
                    <div className={styles.messageBoxButtons}>
                        {messageBody && (
                            <button
                                className={styles.previewButton}
                                onClick={() => handlePreviewButtonClick(preview)}
                                type="button"
                            >

                                <img src={preview ? hidePreviewIcon : previewIcon} alt="" />
                                <span>{preview ? 'Hide Preview' : 'Show Preview'}</span>
                            </button>
                        )}
                        {!preview && (
                            <button
                                className={styles.varButton}
                                onClick={handleVarButtonClick}
                                type="button"
                            >
                                <img src={addIconWhite} alt="" />
                                <span>Insert variable</span>
                            </button>
                        )}
                    </div>
                    {preview ? (
                        <div className={styles.previewContainer}>
                            <span>{previewMessage}</span>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={messageBody}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            className={styles.editor}
                            placeholder={placeholder}
                            rows={8}
                            spellCheck={false}
                        />
                    )}


                </div>

                {showSuggestions && (
                    <div
                        className={styles.suggestionsMenu}
                        style={{
                            top: `${suggestionPosition.top}px`,
                            left: `${suggestionPosition.left}px`,
                        }}
                    >
                        <div className={styles.suggestionsHeader}>
                            <span>Press Esc to close suggestions</span>
                            {currentContext && (
                                <span className={styles.contextBadge}>{currentContext}</span>
                            )}
                        </div>
                        <ul className={styles.suggestionsList}>
                            {suggestions.map((suggestion, index) => (
                                <li
                                    key={index}
                                    className={`${styles.suggestionItem} ${index === activeSuggestion ? styles.active : ''}`}
                                    onClick={() => insertPlaceholder(suggestion)}
                                >
                                    <span className={styles.suggestionText}>{suggestion}</span>
                                    {suggestion.includes('[*]') && (
                                        <span className={styles.arrayBadge}>array</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBox;