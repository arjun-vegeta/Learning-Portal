import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  FiChevronLeft, FiChevronRight, FiDownload, 
  FiMaximize, FiMinimize, FiMinus, FiPlus,
  FiRotateCw, FiSearch
} from 'react-icons/fi';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PDFViewerAdvanced = ({ filePath }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputPageNum, setInputPageNum] = useState('');

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(`http://localhost:5001${filePath}`);
        const pdfDocument = await loadingTask.promise;
        
        if (isMounted) {
          setPdf(pdfDocument);
          setTotalPages(pdfDocument.numPages);
          setPageNum(1);
          setInputPageNum('1');
          setError(null);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setError('Failed to load the PDF document. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadPDF();
    
    return () => {
      isMounted = false;
    };
  }, [filePath]);

  // Render PDF page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    
    const renderPage = async () => {
      try {
        setLoading(true);
        const page = await pdf.getPage(pageNum);
        
        // Get device pixel ratio for high DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Apply rotation if needed
        const viewport = page.getViewport({
          scale: scale,
          rotation: rotation
        });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas size to match viewport
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Scale canvas for high DPI displays
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.width = viewport.width * pixelRatio;
        canvas.height = viewport.height * pixelRatio;
        
        // Scale context for high DPI displays
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: true,
          renderInteractiveForms: true,
          background: 'white'
        };
        
        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        setError('Failed to render the page. Please try again.');
        setLoading(false);
      }
    };
    
    renderPage();
  }, [pdf, pageNum, scale, rotation]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Update fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Navigation functions
  const goToPreviousPage = () => {
    if (pageNum > 1) {
      setPageNum(prevPageNum => {
        const newPageNum = prevPageNum - 1;
        setInputPageNum(newPageNum.toString());
        return newPageNum;
      });
    }
  };

  const goToNextPage = () => {
    if (pageNum < totalPages) {
      setPageNum(prevPageNum => {
        const newPageNum = prevPageNum + 1;
        setInputPageNum(newPageNum.toString());
        return newPageNum;
      });
    }
  };

  const handleInputChange = (e) => {
    setInputPageNum(e.target.value);
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNumber = parseInt(inputPageNum, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setPageNum(pageNumber);
    } else {
      setInputPageNum(pageNum.toString());
    }
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  // Handle download
  const handleDownload = () => {
    window.open(`http://localhost:5001${filePath}`, '_blank');
  };

  return (
    <div 
      ref={containerRef} 
      className="pdf-viewer-container"
    >
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-200 p-2 flex flex-wrap items-center justify-between gap-2">
        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={pageNum <= 1 || loading}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <form onSubmit={handlePageSubmit} className="flex items-center">
            <input
              type="text"
              value={inputPageNum}
              onChange={handleInputChange}
              className="w-12 px-2 py-1 text-center border border-gray-300 rounded"
              aria-label="Page number"
            />
            <span className="mx-1 text-gray-600">/ {totalPages}</span>
          </form>
          
          <button
            onClick={goToNextPage}
            disabled={pageNum >= totalPages || loading}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
        
        {/* Center section - zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={loading}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <FiMinus size={20} />
          </button>
          
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          
          <button
            onClick={handleZoomIn}
            disabled={loading}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <FiPlus size={20} />
          </button>
        </div>
        
        {/* Right section - additional controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotate}
            disabled={loading}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rotate"
          >
            <FiRotateCw size={20} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200"
            title="Download"
          >
            <FiDownload size={20} />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-200"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize size={20} /> : <FiMaximize size={20} />}
          </button>
        </div>
      </div>
      
      {/* PDF Rendering Area */}
      <div 
        className={`pdf-container flex justify-center items-center overflow-auto bg-gray-800 ${loading ? 'relative' : ''}`}
        style={{ height: isFullscreen ? 'calc(100vh - 56px)' : '70vh' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
            <div className="bg-white rounded-lg p-6 shadow-xl text-center">
              <div className="loader mb-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-700">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md mx-auto">
            <div className="text-red-500 mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load PDF</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="inline-block bg-white shadow-lg m-4">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerAdvanced; 