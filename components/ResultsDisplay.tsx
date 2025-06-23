/// <reference types="react" />
import React from 'react';

interface ResultsDisplayProps {
  title: string;
  content: string;
  onClose?: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ title, content, onClose }) => {

  const applyInlineFormatting = (line: string): string => {
    // Must apply strong/em before code, to avoid issues with * or _ inside code
    let formattedLine = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold **text**
      .replace(/__(.*?)__/g, '<strong>$1</strong>')   // Bold __text__
      .replace(/\*(.*?)\*/g, '<em>$1</em>')     // Italic *text*
      .replace(/_(.*?)_/g, '<em>$1</em>');      // Italic _text_

    formattedLine = formattedLine.replace(/`([^`]+?)`/g, (match, p1) => {
        return `<code class="px-1 py-0.5 bg-neutral-light border border-neutral-medium rounded text-sm text-brand-primary font-mono">${p1}</code>`;
    });
    return formattedLine;
  };

  const handleCopyCode = async (codeToCopy: string, buttonElement: HTMLButtonElement) => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      const originalText = buttonElement.textContent;
      buttonElement.textContent = 'Copied!';
      buttonElement.classList.add('bg-green-500', 'hover:bg-green-600');
      buttonElement.classList.remove('bg-neutral-medium', 'hover:bg-brand-primary');

      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove('bg-green-500', 'hover:bg-green-600');
        buttonElement.classList.add('bg-neutral-medium', 'hover:bg-brand-primary');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
      const originalText = buttonElement.textContent;
      buttonElement.textContent = 'Error!';
      buttonElement.classList.add('bg-red-500', 'hover:bg-red-600');
      buttonElement.classList.remove('bg-neutral-medium', 'hover:bg-brand-primary');

      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove('bg-red-500', 'hover:bg-red-600');
        buttonElement.classList.add('bg-neutral-medium', 'hover:bg-brand-primary');
      }, 2000);
    }
  };

  const renderFormattedContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentListType: 'ul' | 'ol' | null = null;
    let listItems: React.ReactNode[] = []; 

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    const flushList = () => {
      if (listItems.length > 0 && currentListType) {
        const listKey = `list-${elements.length}`;
        if (currentListType === 'ul') {
          elements.push(
            <ul key={listKey} className="list-disc list-inside pl-5 my-2 space-y-1">
              {listItems}
            </ul>
          );
        } else if (currentListType === 'ol') {
          elements.push(
            <ol key={listKey} className="list-decimal list-inside pl-5 my-2 space-y-1">
              {listItems}
            </ol>
          );
        }
        listItems = [];
        currentListType = null;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        flushList();
        if (inCodeBlock) { // End of code block
          const codeContentStr = codeBlockContent.join('\n');
          elements.push(
            <div key={`code-wrapper-${elements.length}`} className="relative group my-3" role="group" aria-label={`Code block${codeBlockLang ? ' type ' + codeBlockLang : ''}`}>
              <pre className="bg-neutral-dark text-neutral-light p-3 sm:p-4 rounded-md overflow-x-auto text-sm shadow-md pt-10 sm:pt-11 font-mono">
                <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>
                  {codeContentStr}
                </code>
              </pre>
              <button
                onClick={(e) => handleCopyCode(codeContentStr, e.currentTarget)}
                className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-2.5 py-1 bg-neutral-medium text-neutral-light text-xs font-medium rounded shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 ease-in-out hover:bg-brand-primary focus:ring-2 focus:ring-brand-accent focus:outline-none"
                aria-label="Copy code to clipboard"
              >
                Copy
              </button>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLang = '';
        } else { // Start of code block
          inCodeBlock = true;
          codeBlockLang = line.substring(3).trim().toLowerCase();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      if (line.startsWith('#')) {
        flushList();
        let level = 0;
        while (level < line.length && line[level] === '#') level++;
        const contentText = line.substring(level).trim();
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        
        let textSizeClass = 'text-base';
        if (level === 1) textSizeClass = 'text-2xl mt-4 mb-2 font-bold';
        else if (level === 2) textSizeClass = 'text-xl mt-3 mb-1 font-semibold';
        else if (level === 3) textSizeClass = 'text-lg mt-2 mb-1 font-semibold';
        else if (level >= 4) textSizeClass = 'text-base mt-1 mb-1 font-semibold';

        elements.push(<Tag key={`h-${elements.length}`} className={`${textSizeClass} text-neutral-dark`} dangerouslySetInnerHTML={{ __html: applyInlineFormatting(contentText) }} />);
        continue;
      }

      const ulMatch = line.match(/^(\s*)(-|\*)\s+(.*)/);
      if (ulMatch) {
        if (currentListType !== 'ul') {
          flushList();
          currentListType = 'ul';
        }
        listItems.push(<li key={`li-${elements.length}-${listItems.length}`} dangerouslySetInnerHTML={{ __html: applyInlineFormatting(ulMatch[3]) }} />);
        continue;
      }

      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
      if (olMatch) {
        if (currentListType !== 'ol') {
          flushList();
          currentListType = 'ol';
        }
        listItems.push(<li key={`li-${elements.length}-${listItems.length}`} dangerouslySetInnerHTML={{ __html: applyInlineFormatting(olMatch[3]) }} />);
        continue;
      }
      
      if (line.match(/^---+$/) || line.match(/^\*\*\*+$/) || line.match(/^___+$/)) {
          flushList();
          elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-neutral-light" />);
          continue;
      }

      flushList(); 
      
      if (line.trim() === '') {
        // elements.push(<div key={`spacer-${elements.length}`} className="h-2"></div>);
      } else {
        elements.push(<p key={`p-${elements.length}`} className="my-1 text-neutral-dark" dangerouslySetInnerHTML={{ __html: applyInlineFormatting(line) }} />);
      }
    }

    flushList(); 
    if (inCodeBlock && codeBlockContent.length > 0) { 
      const codeContentStr = codeBlockContent.join('\n');
      elements.push(
        <div key={`code-wrapper-${elements.length}`} className="relative group my-3" role="group" aria-label={`Code block${codeBlockLang ? ' type ' + codeBlockLang : ''}`}>
          <pre className="bg-neutral-dark text-neutral-light p-3 sm:p-4 rounded-md overflow-x-auto text-sm shadow-md pt-10 sm:pt-11 font-mono">
            <code className={codeBlockLang ? `language-${codeBlockLang}` : ''}>
              {codeContentStr}
            </code>
          </pre>
          <button
            onClick={(e) => handleCopyCode(codeContentStr, e.currentTarget)}
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-2.5 py-1 bg-neutral-medium text-neutral-light text-xs font-medium rounded shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 ease-in-out hover:bg-brand-primary focus:ring-2 focus:ring-brand-accent focus:outline-none"
            aria-label="Copy code to clipboard"
          >
            Copy
          </button>
        </div>
      );
    }
    return elements;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-40 transition-opacity duration-300" role="dialog" aria-modal="true" aria-labelledby="results-title">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-neutral-light">
          <h3 id="results-title" className="text-xl font-semibold text-brand-primary">{title}</h3>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-neutral-medium hover:text-neutral-dark text-3xl leading-none p-1 hover:bg-neutral-light rounded-full transition-colors"
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto text-sm">
          {renderFormattedContent(content)}
        </div>
         {onClose && (
            <div className="p-3 sm:p-4 border-t border-neutral-light text-right bg-gray-50">
                <button 
                onClick={onClose} 
                className="px-5 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors text-sm font-medium"
                >
                Close
                </button>
            </div>
          )}
      </div>
    </div>
  );
};