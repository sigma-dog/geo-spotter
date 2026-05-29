export const apiMethods = {
    get: 'GET',
    post: 'POST',
    put: 'PUT',
    patch: 'PATCH',
    delete: 'DELETE',
} as const;

export const tagTypes = {
    // Текущий пользователь
    CurrentUser: 'CurrentUser',
    GameSession: 'GameSession',

    // Друзья
    Friend: 'Friend',
    FriendsList: 'FriendsList',
    FriendshipRequests: 'FriendshipRequests',
} as const;
