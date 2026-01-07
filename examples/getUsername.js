function getUsername(user) {
  return user.profile.name.toUpperCase();
}

module.exports = getUsername;
