import {client} from './client.js';

export const user = {
    me: async () => {
        const { data, error } = await client.auth.getUser();    
        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }
        return data.user;
    },

    login: async (email, password) => {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message);
        }
        return data.user;
    },
    signup: async (email, password) => {
        const { data, error } = await client.auth.signUp({ email, password });  
        if (error) {
            throw new Error(error.message);
        }   
        return data.user;
    },
    logout: async () => {
        const { error } = await client.auth.signOut();  
        if (error) {
            throw new Error(error.message);
        }
    }
};