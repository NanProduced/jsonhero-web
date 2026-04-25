import { useState, useEffect } from "react";
import { Body } from "~/components/Primitives/Body";
import { SmallBody } from "~/components/Primitives/SmallBody";
import { ISBNData } from "~/utilities/formatDetectors";
import { PreviewBox } from "../PreviewBox";

export type PreviewISBNProps = {
  data: ISBNData;
};

export function PreviewISBN({ data }: PreviewISBNProps) {
  const [bookInfo, setBookInfo] = useState<{
    title?: string;
    author?: string;
    coverUrl?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const isbn = data.isbn.replace(/-/g, "");
        
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

        try {
          const response = await fetch(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
          );

          if (response.ok) {
            const json = await response.json();
            const bookData = json[`ISBN:${isbn}`];

            if (bookData) {
              setBookInfo({
                title: bookData.title,
                author: bookData.authors?.[0]?.name,
                coverUrl: coverUrl,
              });
            } else {
              setBookInfo({
                coverUrl: coverUrl,
              });
            }
          } else {
            setBookInfo({
              coverUrl: coverUrl,
            });
          }
        } catch {
          setBookInfo({
            coverUrl: coverUrl,
          });
        }
      } catch (err) {
        setError("Failed to load book information");
      } finally {
        setLoading(false);
      }
    };

    fetchBookInfo();
  }, [data.isbn]);

  const openLibraryLink = `https://openlibrary.org/isbn/${data.isbn}`;

  return (
    <PreviewBox link={openLibraryLink}>
      <div className="space-y-3">
        <div>
          <Body className="font-medium">
            {data.type}: {data.isbn}
          </Body>
          <SmallBody className="text-slate-500 dark:text-slate-400">
            International Standard Book Number
          </SmallBody>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 bg-slate-200 dark:bg-slate-700 rounded-sm animate-pulse">
            <SmallBody className="text-slate-500 dark:text-slate-400">
              Loading book info...
            </SmallBody>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 bg-slate-200 dark:bg-slate-700 rounded-sm">
            <SmallBody className="text-slate-500 dark:text-slate-400">
              {error}
            </SmallBody>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            {bookInfo?.coverUrl && (
              <div className="flex-shrink-0">
                <img
                  src={bookInfo.coverUrl}
                  alt={bookInfo?.title || "Book cover"}
                  className="max-h-64 rounded-sm shadow-md object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {bookInfo?.title && (
                <div>
                  <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                    Title
                  </SmallBody>
                  <Body className="font-medium">{bookInfo.title}</Body>
                </div>
              )}
              {bookInfo?.author && (
                <div>
                  <SmallBody className="text-slate-500 dark:text-slate-400 font-medium">
                    Author
                  </SmallBody>
                  <Body>{bookInfo.author}</Body>
                </div>
              )}
            </div>
          </div>
        )}

        <SmallBody className="text-xs text-slate-400 dark:text-slate-500">
          Click to view on Open Library
        </SmallBody>
      </div>
    </PreviewBox>
  );
}
