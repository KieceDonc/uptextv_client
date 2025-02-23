const watcher = require('../../watcher');
const twitch = require('../../utils/twitch')
const uptextvAPI = require('../../utils/uptextv-api')
const debug = require('../../utils/debug')
const groupSection = require('./groupSection')
const pinButtonFollow = require('./pinButtonFollow');
const pinButtonSideNav = require('./pinButtonSideNav')
const sideBottomBar = require('./sideBottomBar');
const defaultLiveColor = '#007aa3'

var groupsSection = new Array()
//var groups = new Array()

var userID // id of current user

class SideGroupsModule{
    constructor(){
      if(!twitch.getCurrentUser()){
        // user isn't connected
        return null
      }  

      userID = twitch.getCurrentUser().id
      
      uptextvAPI.setup(userID).then(()=>{
        uptextvAPI.getGroupsStreamers(userID).then((groups)=>{
          groups.sort((groupA,groupB)=>{
            return groupB.groupIndex - groupA.groupIndex
          })
          watcher.on('load.sidenav',()=>{
            groups.forEach((currentGroup)=>{
              setupGroupSection(currentGroup,this)
            })
            sideBottomBar.setup(this)
            checkSettingsMenuCollision()
            pinButtonSideNav.setup(this)
            handleUpdateEach5min(this)
          })
        })
      }).catch((err)=>{
        debug.error('error:',err )
      })

      watcher.on('load.followbar',()=>{
        pinButtonFollow.setup(this)
      })
    }

    getUserID(){
      return userID
    }

    getGroupsSection(){
      return groupsSection
    }

    // add a new group section on top from id
    // id must be in ASCII CODE
    addNewGroupSection(groupID){
      uptextvAPI.addGroup(groupID,userID).then(()=>{
        let newGroupObject = {
          name:groupID,
          list:[],
          liveColor:defaultLiveColor,
          sortByIndex:0,
          isGroupHiden:false,
          groupIndex:0
        }
        // because you added a new group section you need to shift every group section index by one
        groupsSection.forEach((currentGroupSection)=>{
          currentGroupSection.setGroupIndex(currentGroupSection.getGroupIndex()+1)
        }) 
        setupGroupSection(newGroupObject,this)
        this.getGroupSectionByIndex(0).checkSettingsMenuCollision()
      }).catch((err)=>{
        debug.error('error while trying to add a new group in index.js',err)
      })
    }

    deleteGroupSection(indexOfGroup){  
      // splice delete from groupsSection and stock in deletedGroupSection the deleted group section 
      let deletedGroupSection = groupsSection.splice(indexOfGroup, 1)[0];
      let deletedGroupSectionIndex = deletedGroupSection.getGroupIndex()

      // for every group section you need to check if the 'current group section' is higher than the deleted group section index
      // you have to do to decremente the value also you will have bugs
      groupsSection.forEach((currentGroupSection)=>{
        let currentGroupSectionIndex = currentGroupSection.getGroupIndex()
        if(currentGroupSectionIndex>deletedGroupSectionIndex){
          currentGroupSection.setGroupIndex(currentGroupSectionIndex-1)
        }
      })
      this.getGroupSectionByIndex(0).checkSettingsMenuCollision()
    }

    getGroupSectionIndexByID(groupID){
      let founded = false
      let cmpt = 0
      do{
        if(groupsSection[cmpt].getGroupID()==groupID){
          return groupsSection[cmpt].getGroupIndex()
        }
        cmpt++
      }while(cmpt<groupsSection.length&&!founded)
      return -2 // normaly impossible
    }

    getGroupSectionByIndex(index){
      if(index>=groupsSection.length||index<0){
        return -1
      }
      let founded = false
      let cmpt = 0
      do{
        if(groupsSection[cmpt].getGroupIndex()==index){
          return groupsSection[cmpt]
        }
        cmpt++
      }while(cmpt<groupsSection.length&&!founded)
      return -1 // normaly impossible
    }

    groupsSectionSwitchElements(first_element_index,second_element_index){
      let newGroupsSection = new Array()
      for(let x=0;x<groupsSection.length;x++){
        if(x==first_element_index||x==second_element_index){
          if(first_element_index==x){
            newGroupsSection.push(groupsSection[second_element_index])
          }else{
            newGroupsSection.push(groupsSection[first_element_index])
          }
        }else{
          newGroupsSection.push(groupsSection[x])
        }
      }
      groupsSection = newGroupsSection
    }
}

/**
 * Handle onBroadcastUpdate with 1 s of cooldown 
 * ( you need a cooldown cuz of groupsIndex for example )
 */
let isInCooldown= false
let groupsToUpdate = null
uptextvAPI.onBroadcastGroupsUpdate((receiveGroups)=>{

  updateGroups = (groups)=>{
    groupsSection.forEach((currentGroupSection)=>{
      currentGroupSection.HTMLRemove()
    })
  
    groupsSection = new Array()
  
    groups.sort((groupA,groupB)=>{
      return groupB.groupIndex - groupA.groupIndex
    })
    groups.forEach((currentGroup)=>{
      setupGroupSection(currentGroup,this)
    })
  
    checkSettingsMenuCollision()
    pinButtonSideNav.setup(this)
  }

  if(!isInCooldown){
    isInCooldown = true
    updateGroups(receiveGroups)
    setTimeout(()=>{
      if(groupsToUpdate!=null){
        updateGroups(groupsToUpdate)
        groupsToUpdate=null
      }
    },1000)
    isInCooldown=false 
  }else{
    groupsToUpdate=receiveGroups
  }
})

// setup for one group setup a side nav group section
function setupGroupSection(currentGroup,sideGroupsModule){
  var currentGroupSection = groupSection.setup(currentGroup,sideGroupsModule) // groupsSection.length represent the position of the currentGroup
  groupsSection.unshift(currentGroupSection)
}

// handle to update streamers info each 5 min
function handleUpdateEach5min(sideGroupsModule){
  setInterval(function(){    
    updateStreamersInfo(sideGroupsModule)
  },300000)
}

// handle to update streamers info
function updateStreamersInfo(sideGroupsModule){
   uptextvAPI.getGroupsStreamers(userID).then((newGroupsObject)=>{
    newGroupsObject.forEach((currentNewGroupObject)=>{
        let idToFind = currentNewGroupObject['name']
        let founded = false
        let index = -1 
        do{
          index+=1
          let currentGroupSectionID = groupsSection[index].getGroupID()
          founded = currentGroupSectionID === idToFind
        }while(index<groupsSection.length&&!founded)
        if(founded){
          let currentGroupSection = groupsSection[index]
          let oldGroupList = currentGroupSection.getGroupList()
          let newGroupList = currentNewGroupObject['list']
          currentGroupSection.setGroupList(newGroupList)
          currentGroupSection.sortStreamer()
          currentGroupSection.onListUpdate(oldGroupList)
        }else{
          setupGroupSection(currentNewGroupObject,sideGroupsModule)
        }
      })
    }).catch((err)=>{
        debug.error('error while trying to get pinned streamers through the api. err :',err )
    })
}

/**
 * use to check if the settings menu as a collision
 */
function checkSettingsMenuCollision(){
  groupsSection.forEach((currentGroupSection)=>{
    currentGroupSection.checkSettingsMenuCollision()
  })
}

module.exports = new SideGroupsModule()