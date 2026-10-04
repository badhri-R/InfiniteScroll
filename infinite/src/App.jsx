import React, { useState, useEffect, useRef } from "react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const App = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const bottomRef = useRef(null);

  const [mode, setMode] = useState("infinite");
  const [totalPages, setTotalPages] = useState(10);

  const [editPost, setEditPost] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  
  useEffect(() => {
    let ignore = false;

    async function getData() {
      setLoading(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      const searchQuery = debouncedSearch
        ? `&title_like=${encodeURIComponent(debouncedSearch)}`
        : "";

      const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10${searchQuery}`
      );

      const data = await res.json();

      if (ignore) return;

      if (data.length < 10) {
        setHasMore(false);
      }

      if (mode === "pagination") {
        const total = res.headers.get("x-total-count");

        if (total) {
          setTotalPages(Math.ceil(Number(total) / 10));
        }
      }

      setPosts((oldPosts) => {
        if (page === 1) {
          return data;
        }

        return [...oldPosts, ...data];
      });

      setLoading(false);
    }

    getData();

    return () => {
      ignore = true;
    };
  }, [page, debouncedSearch, mode]);


  useEffect(() => {
    if (mode !== "infinite") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry.isIntersecting &&
          !loading &&
          hasMore
        ) {
          setPage((oldPage) => oldPage + 1);
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    const currentBottom = bottomRef.current;

    if (currentBottom) {
      observer.observe(currentBottom);
    }

    return () => {
      if (currentBottom) {
        observer.unobserve(currentBottom);
      }
    };
  }, [loading, hasMore, mode]);

 
  const handleInfiniteScroll = () => {
    setMode("infinite");
    setPosts([]);
    setPage(1);
    setHasMore(true);
  };


  const handlePagination = () => {
    setMode("pagination");
    setPosts([]);
    setPage(1);
    setHasMore(true);
  };

 
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= totalPages &&
      !loading
    ) {
      setPage(newPage);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

 
  const handleEdit = (post) => {
    setEditPost(post);
    setEditTitle(post.title);
    setEditBody(post.body);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const handleSaveEdit = () => {
    setPosts((oldPosts) =>
      oldPosts.map((post) =>
        post.id === editPost.id
          ? {
              ...post,
              title: editTitle,
              body: editBody,
            }
          : post
      )
    );

    setEditPost(null);
    setEditTitle("");
    setEditBody("");
  };


  const handleCancelEdit = () => {
    setEditPost(null);
    setEditTitle("");
    setEditBody("");
  };

  const isFirstLoad = loading && page === 1;
  const isLoadingMore = loading && page > 1;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 16,
      }}
    >
      <h1>Infinite Scroll + Search</h1>

     
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <button
          onClick={handleInfiniteScroll}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "1px solid #ccc",
            cursor: "pointer",
            background:
              mode === "infinite" ? "#333" : "#fff",
            color:
              mode === "infinite" ? "#fff" : "#333",
          }}
        >
          Infinite Scroll
        </button>

        <button
          onClick={handlePagination}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "1px solid #ccc",
            cursor: "pointer",
            background:
              mode === "pagination" ? "#333" : "#fff",
            color:
              mode === "pagination" ? "#fff" : "#333",
          }}
        >
          Pagination
        </button>
      </div>

      
      {editPost && (
        <div
          style={{
            border: "2px solid #333",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <h2>Edit Post {editPost.id}</h2>

          <input
            type="text"
            value={editTitle}
            onChange={(e) =>
              setEditTitle(e.target.value)
            }
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          <textarea
            value={editBody}
            onChange={(e) =>
              setEditBody(e.target.value)
            }
            rows="5"
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button onClick={handleSaveEdit}>
              Save
            </button>

            <button onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      
      <input
        type="text"
        placeholder="Title ..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 16,
          borderRadius: 6,
          border: "1px solid #ccc",
          boxSizing: "border-box",
        }}
      />

      {isFirstLoad && (
        <p style={{ textAlign: "center" }}>
          Loading...
        </p>
      )}

   
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
        
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>
              {post.id}. {post.title}
            </h3>

         
            <button
              onClick={() => handleEdit(post)}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                border: "1px solid #ccc",
                borderRadius: 5,
              }}
            >
              Edit
            </button>
          </div>

          <p>{post.body}</p>
        </div>
      ))}

     
      {!loading && posts.length === 0 && (
        <p style={{ textAlign: "center" }}>
          No data found
        </p>
      )}

    
      {mode === "infinite" && isLoadingMore && (
        <p style={{ textAlign: "center" }}>
          Loading more...
        </p>
      )}

    
      {mode === "infinite" &&
        !hasMore &&
        posts.length > 0 && (
          <p style={{ textAlign: "center" }}>
            No more data
          </p>
        )}

      {mode === "pagination" && !loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              handlePageChange(page - 1)
            }
            disabled={page === 1}
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          ).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() =>
                handlePageChange(pageNumber)
              }
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background:
                  page === pageNumber
                    ? "#333"
                    : "#fff",
                color:
                  page === pageNumber
                    ? "#fff"
                    : "#333",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            >
              {pageNumber}
            </button>
          ))}

          <button
            onClick={() =>
              handlePageChange(page + 1)
            }
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

    
      {mode === "infinite" && hasMore && (
        <div
          ref={bottomRef}
          style={{
            height: 50,
            marginTop: 20,
          }}
        />
      )}
    </div>
  );
};

export default App;