import { Spinner } from "../components/spinner";
import { BookCard } from "../components/bookcard";

export const Home = ({ books, loading, onSelectBook }) => {

  if (loading) return <Spinner />;

  return (
    <>
      <div className="shelf-frame">
        <div className="shelf">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onClick={onSelectBook} />
          ))}
        </div>
      </div>
    </>
  )
}