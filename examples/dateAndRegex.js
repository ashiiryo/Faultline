function check(date, re, s) {
  return date.getFullYear() + ' ' + date.toISOString() + ' ' + re.test(s) + ' ' + re.exec(s);
}

module.exports = check;
