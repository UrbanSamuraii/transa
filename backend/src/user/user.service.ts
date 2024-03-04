import { Injectable, Req, Res, Body, ForbiddenException, HttpStatus, HttpCode } from "@nestjs/common";
import { Prisma, User } from '@prisma/client';
import { PrismaService } from "../prisma/prisma.service";
import { HttpException } from '@nestjs/common';

@Injectable()
export class UserService {

    constructor(private prisma: PrismaService) { }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        try {
            return await this.prisma.user.create({
                data,
            });
        } catch (error) {
            return error;
        }
    }


    async getUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where,
        });
    }

    async getUserById(id: number): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });
    }


    async getUserByToken(token: string) {
        try {
            const user = await this.prisma.user.findFirst({
                where: { accessToken: token },
                include: { conversations: true, blockedUsers: true, blockedBy: true },
            });
            return user;
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: "Error to get the user by token"
            }, HttpStatus.BAD_REQUEST);
        }
    }

    async getUserByUsername(username: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { username: username },
                include: {
                    gamesWon: true,
                    friends: true,
                }
            });
            if (!user) {
                throw new HttpException({
                    status: HttpStatus.NOT_FOUND,
                    error: "Error: User not found"
                }, HttpStatus.NOT_FOUND);
            }
            return user;
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.NOT_FOUND,
                error: "Error: User not found"
            }, HttpStatus.NOT_FOUND);
        }
    }

    async getEloRating(userId: number): Promise<number> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { eloRating: true }
            });

            if (user) {
                return user.eloRating;
            } else {
                throw new Error(`User with ID ${userId} not found.`);
            }
        } catch (error) {
            console.error("Error retrieving ELO rating:", error);
            throw error;
        }
    }

    async getUserByEmail(email: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email: email }
            });
            if (!user) {
                throw new HttpException({
                    status: HttpStatus.BAD_REQUEST,
                    error: "Error: User not found"
                }, HttpStatus.BAD_REQUEST);
            }
            return user;
        } catch (error) {
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: "Error: Unable to retrieve user"
            }, HttpStatus.BAD_REQUEST);
        }
    }

    async getUserIdByUsername(username: string): Promise<number | null> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: { id: true } // Select only the ID
        });
        return user?.id || null;
    }

    async deleteUser(where: Prisma.UserWhereUniqueInput) {
        try {
            return await this.prisma.user.delete({
                where,
            });
        } catch (error) {
            return error;
        }
    }

    //UPDATE GAME RELATED DATABASE

    async incrementGamesWon(userId: number): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    totalGamesWon: {
                        increment: 1 // Increment the gamesWon field by 1
                    }
                }
            });
        } catch (error) {
            // Handle errors, possibly throw a custom error or log it
            console.error("Error incrementing games won:", error);
            throw error;
        }
    }

    async incrementGamesLost(userId: number): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    totalGamesLost: {
                        increment: 1
                    }
                }
            });
        } catch (error) {
            // Handle errors, possibly throw a custom error or log it
            console.error("Error incrementing games won:", error);
            throw error;
        }
    }

    async updateEloRating(userId: number, newEloRating: number): Promise<void> {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    eloRating: newEloRating
                }
            });
        } catch (error) {
            console.error("Error updating ELO rating:", error);
            throw error;
        }
    }

    // SPECIFIC for Conversations
    // To get the user - and the fact that we find it or not
    async getUserByUsernameOrEmail(inputDataMember: string): Promise<User | null> {
        const usersArray = inputDataMember.split(/[.,;!?'"<>]|\s/);
        const email = usersArray[0];
        let member = null;

        const memberByEmail = usersArray[0] !== "" ? await this.getUser({ email }) : null;
        if (memberByEmail) {
            return memberByEmail;
        } else {
            const username = usersArray[0];
            const memberByUsername = usersArray[0] !== "" ? await this.getUser({ username }) : null;
            if (memberByUsername) {
                return memberByUsername;
            }
            else { return null; }
        }
    }

    async getGlobalLeaderboard() {
        const users = await this.prisma.user.findMany({
            select: {
                username: true,
                eloRating: true,
                totalGamesWon: true,
                totalGamesLost: true,
            },
            orderBy: {
                eloRating: 'desc',
            },
        });

        return users.map(user => ({
            ...user,
            winPercentage: user.totalGamesWon + user.totalGamesLost > 0
                ? Math.round((user.totalGamesWon / (user.totalGamesWon + user.totalGamesLost)) * 100)
                : 0,
        }));
    }

    async getUserLeaderboard(username: string) {
        const allUsers = await this.prisma.user.findMany({
            select: {
                username: true,
                eloRating: true,
                totalGamesWon: true,
                totalGamesLost: true,
            },
            orderBy: {
                eloRating: 'desc',
            },
        });

        const userIndex = allUsers.findIndex(user => user.username === username);

        if (userIndex === -1) {
            // Handle case where user is not found
            throw new Error('User not found');
        }

        // Define a range around the user's rank to display
        const range = 5;
        const start = Math.max(0, userIndex - range);
        const end = Math.min(userIndex + range, allUsers.length - 1);

        return allUsers.slice(start, end + 1).map(user => ({
            ...user,
            winPercentage: user.totalGamesWon + user.totalGamesLost > 0
                ? Math.round((user.totalGamesWon / (user.totalGamesWon + user.totalGamesLost)) * 100)
                : 0,
        }));
    }

    //////////////// FRIENDSHIP RELATIONS //////////////////

    async sendInvitation(userId: number, targetId: number) {
        const isFriend = await this.isAlreadyFriend(userId, targetId);
        if (isFriend) { return false; }

        await this.prisma.user.update({
            where: { id: targetId },
            data: { invited_by: { connect: [{ id: userId }] }, },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { inviting: { connect: [{ id: targetId }] } },
        });
        return true;
    }

    async isAlreadyInvited(userId: number, targetId: number) {
        const invited = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { inviting: { where: { id: targetId }} },
          });
          return !!invited?.inviting.length;
    }

    async getInvitations(userId: number): Promise<User[] | null> {
		const user = await this.prisma.user.findUnique({
		  where: { id: userId },
		  include: { invited_by: true },
		});
		if (user) {
			const invitationList = user.invited_by;
		    return invitationList; 
		} 
		else { return null; }
	}

    async declineInvitation(userId: number, targetId: number) {
        const isFriend = await this.isAlreadyFriend(userId, targetId);
        if (isFriend) { return false; }

        await this.prisma.user.update({
            where: { id: userId },
            data: { invited_by: { disconnect: [{ id: targetId }] }, },
        });
        await this.prisma.user.update({
            where: { id: targetId },
            data: { inviting: { disconnect: [{ id: userId }] } },
        });
        return true;
    }

    async addNewFriend(userId: number, targetId: number) {
        const isFriend = await this.isAlreadyFriend(userId, targetId);
        if (isFriend) { return false; }

        await this.prisma.user.update({
            where: { id: userId },
            data: { friends: { connect: [{ id: targetId }] },
                    invited_by: { disconnect: [{id: targetId}]} },
        });
        await this.prisma.user.update({
            where: { id: targetId },
            data: { friends: { connect: [{ id: userId }] }},
        });
        await this.prisma.user.update({
            where: { id: targetId },
            data: { friendOf: { connect: [{ id: userId }] },
                    inviting: { disconnect: [{id: userId}]} },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { friendOf: { connect: [{ id: targetId }] }},
        });
        return true;
    }

    async removeFriend(userId: number, targetId: number) {
        const isFriend = await this.isAlreadyFriend(userId, targetId);
        if (!isFriend) { return false; }

        await this.prisma.user.update({
            where: { id: userId },
            data: { friends: { disconnect: [{ id: targetId }] }, },
        });
        await this.prisma.user.update({
            where: { id: targetId },
            data: { friends: { disconnect: [{ id: userId }] }, },
        });
        await this.prisma.user.update({
            where: { id: targetId },
            data: { friendOf: { disconnect: [{ id: userId }] } },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { friendOf: { disconnect: [{ id: targetId }] } },
        });
        return true;
    }

    async isAlreadyFriend(userId: number, targetId: number) {
        const friend = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { friends: { where: { id: targetId }} },
          });
          return !!friend?.friends.length;
    }

    async getUserFriendsList(userId: number): Promise<User[] | null> {
		const user = await this.prisma.user.findUnique({
		  where: { id: userId },
		  include: { friends: true },
		});
		if (user) {
			const friendsList = user.friends;
		    return friendsList; 
		} 
		else { return null; }
	}

    // async getNbrOfFriends(userId: number) {
	// 	const user = await this.prisma.user.findUnique({
    //         where: { id: userId },
    //         include: { friends: true },
    //     });
    // if (user && user.friends) {
    //     const numberOfFriends = user.friends.length;
    //     console.log(`Number of friends: ${numberOfFriends}`);
    //     return numberOfFriends;
    // } else {
    //     console.error("User or friends array not found.");
    //     return 0;
    // }
    // }

    //////////////// 2FA SETTNGS //////////////////

    // Update our user with the 2FA secret generated in the auth.service
    async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { two_factor_secret: secret }
        });
    }

    // To allow our user to Turn-on the 2FA authentication mode
    // We need here to UPDATE THE TOKEN with a 2FA SIGNED ONE
    async turnOnTwoFactorAuthentication(userId: number, new2FAToken: string) {
        const updateUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                is_two_factor_activate: true,
                accessToken: new2FAToken
            }
        });
        return updateUser;
    }

    async updateUserAvatar(userId: number, avatarPath: string): Promise<void> {
        try {
            // Assuming you are using Prisma or a similar ORM/library, update the user's avatar field in the database
            await this.prisma.user.update({
                where: { id: userId },
                data: { img_url: avatarPath },
            });
        } catch (error) {
            // Handle any database-related errors here
            throw new Error('Error updating user avatar');
        }
    }
}

