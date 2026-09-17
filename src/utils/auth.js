export const getStoredUser = () =>{ 
    try{
        return JSON.parse(localStorage.getItem("user")||"{}");
    }catch(error){
        console.log(error);
        return {};
    }
};

export const getUserRole=()=>{
    const user= getStoredUser();
    return user?.role_name;
};

export const isAdminOrStaff = () => {
    const role = getUserRole();
    return role === "Admin" || role === "Staff";
};

export const isAdmin = () => {
    return getUserRole() === "Admin";
};

export const isStaff = () => {
    return getUserRole() === "Staff";
};

export const isPlayer = () => {
    return getUserRole() === "Player";
};