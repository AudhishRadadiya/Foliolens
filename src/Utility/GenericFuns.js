export const AlphbeticallySort = (list) => {
  if (list.length === 0) return;
  list.sort(function (a, b) {
    if (a.text < b.text) {
      return -1;
    }
    if (a.text > b.text) {
      return 1;
    }
    return 0;
  });
  return list;
};
