import { useEffect, useState } from "react";
import { Body } from "~/components/Primitives/Body";
import { Title } from "~/components/Primitives/Title";
import { PreviewBox } from "../PreviewBox";

export type PreviewISBNProps = {
  isbn: string;
  variant: "isbn10" | "isbn13";
};

export function PreviewISBN({ isbn, variant }: PreviewISBNProps) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [bookInfo, setBookInfo] = useState<{
    title?: string;
    authors?: string[];
    publishDate?: string;
  } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const coverUrlLarge = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  const coverUrlMedium = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  const openLibraryLink = `https://openlibrary.org/isbn/${isbn}`;

  useEffect(() => {
    setCoverLoaded(false);
    setCoverError(false);
    setBookInfo(null);

    const fetchBookInfo = async () => {
      setLoadingInfo(true);
      try {
        const response = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
        );
        if (response.ok) {
          const data = await response.json();
          const bookData = data[`ISBN:${isbn}`];
          if (bookData) {
            setBookInfo({
              title: bookData.title,
              authors: bookData.authors?.map((a: { name: string }) => a.name),
              publishDate: bookData.publish_date,
            });
          }
        }
      } catch {
        // Silently fail - book info is optional
      } finally {
        setLoadingInfo(false);
      }
    };

    fetchBookInfo();
  }, [isbn]);

  const formattedISBN = formatISBN(isbn, variant);

  return (
    <div>
      <PreviewBox link={openLibraryLink}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0 flex justify-center">
            {!coverError ? (
              <div className="relative">
                <img
                  src={coverUrlMedium}
                  alt={`Book cover for ISBN ${isbn}`}
                  className={`w-32 h-auto rounded shadow-md transition-opacity duration-300 ${
                    coverLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setCoverLoaded(true)}
                  onError={() => setCoverError(true)}
                  loading="lazy"
                />
                {!coverLoaded && (
                  <div className="absolute inset-0 w-32 h-44 bg-slate-200 dark:bg-slate-700 rounded animate-pulse flex items-center justify-center">
                    <Body className="text-slate-400 dark:text-slate-500 text-xs">
                      Loading cover...
                    </Body>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-44 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="text-center p-2">
                  <svg
                    className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <Body className="text-slate-400 dark:text-slate-500 text-xs">
                    No cover available
                  </Body>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Title className="text-slate-700 dark:text-slate-400 mb-2">
              Book Information
            </Title>

            {loadingInfo ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
              </div>
            ) : bookInfo?.title ? (
              <div className="space-y-1">
                <Body className="font-medium text-slate-800 dark:text-slate-200">
                  {bookInfo.title}
                </Body>
                {bookInfo.authors && bookInfo.authors.length > 0 && (
                  <Body className="text-sm text-slate-600 dark:text-slate-400">
                    by {bookInfo.authors.join(", ")}
                  </Body>
                )}
                {bookInfo.publishDate && (
                  <Body className="text-sm text-slate-500 dark:text-slate-500">
                    Published: {bookInfo.publishDate}
                  </Body>
                )}
              </div>
            ) : (
              <Body className="text-slate-500 dark:text-slate-500 text-sm">
                No additional information available
              </Body>
            )}

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Body className="text-sm text-slate-500 dark:text-slate-500">
                    ISBN ({variant.toUpperCase()}):
                  </Body>
                  <Body className="font-mono text-sm text-slate-800 dark:text-slate-200">
                    {formattedISBN}
                  </Body>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Body className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          Book data from Open Library. Click to view on Open Library.
        </Body>
      </PreviewBox>
    </div>
  );
}

function formatISBN(isbn: string, variant: "isbn10" | "isbn13"): string {
  if (variant === "isbn13") {
    return `${isbn.slice(0, 3)}-${isbn.slice(3, 4)}-${isbn.slice(4, 9)}-${isbn.slice(9, 12)}-${isbn.slice(12)}`;
  } else {
    return `${isbn.slice(0, 1)}-${isbn.slice(1, 6)}-${isbn.slice(6, 9)}-${isbn.slice(9)}`;
  }
}
