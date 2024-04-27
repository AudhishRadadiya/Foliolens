import React from "react";
import ReactPaginate from "react-paginate";

function PaginationInput({ handleClick, pageCount }) {
  return (
    <ReactPaginate
      disabledClassName="disabled"
      initialPage={0}
      breakLabel="..."
      nextLabel=">"
      onPageChange={handleClick}
      pageCount={pageCount}
      pageRangeDisplayed={2}
      previousLabel="<"
      renderOnZeroPageCount={null}
      activeClassName="active"
      subContainerClassName="pages pagination"
      breakLinkClassName="page-link"
      containerClassName="pagination"
      pageClassName="page-item"
      pageLinkClassName="page-link"
      previousClassName="page-item"
      previousLinkClassName="page-link"
      nextClassName="page-item"
      nextLinkClassName="page-link"
    />
  );
}

export default PaginationInput;
