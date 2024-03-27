import React, {useCallback, useContext, useEffect, useState, SyntheticEvent} from "react";
import {AlgorithmDataContext} from "@/contexts/AlgorithmDataContext";
import useSWRSubscription from "swr/subscription";
import {Anchor, Center, ColorInput, Group, Loader, rem, ScrollArea, Stack, Table, Text, Tooltip, Button, Switch, Input, SimpleGrid} from "@mantine/core";


var string_label="Select ego vehicle by ID [?-?]:";
var carID_min=-1, carID_max=-1, carID, init_flag=0; 
var arrayTo;
var K_value=5, Ego_value=0;


export default function () {
    const {mapAgentsData, temporalCloakingData, setTemporalCloakingData} = useContext(AlgorithmDataContext);


    if(init_flag<3){
        mapAgentsData.activeAgents.forEach((ag_id) => {
            arrayTo = ag_id.split("-"); 
            carID = +arrayTo[1];
    
            if(carID_min==-1) carID_min = carID;
            if(carID_max==-1) carID_max = carID;
            if(carID < carID_min) carID_min = carID;
            else if(carID > carID_max) carID_max = carID;
        })
        if(carID_min!=-1 && carID_max!=-1) init_flag++;
        if(init_flag==3) string_label = "Select ego vehicle by ID ["+carID_min.toString()+"-"+carID_max.toString()+"]:";
    }
    
    const handleChooseK = (e: React.FormEvent<HTMLInputElement>): void => {
        var toNum: number = +e.currentTarget.value;
        K_value = toNum;

        if(toNum>=2 && toNum<=10){
            const newData = temporalCloakingData
            newData.constraint_k = toNum
            setTemporalCloakingData(newData)
        }
    };

    const handleChooseEgo = (e: React.FormEvent<HTMLInputElement>): void => {
        var toNum: number = +e.currentTarget.value;
        Ego_value = toNum;

        if(toNum>=carID_min && toNum<=carID_max){
            const newData = temporalCloakingData
            newData.ego_vehicle_id = toNum
            setTemporalCloakingData(newData)
        }
    };


        return (
        <div style={{overflowY: 'auto', maxHeight: "50vh"}}>
            <SimpleGrid cols={2}>
                <label>Constraint k [2-10]:</label>
                <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={K_value} onChange={handleChooseK} />
                <label>{string_label}</label>
                <Input style={{display: "inline-block", marginLeft: 4}} type="number" value={Ego_value} onChange={handleChooseEgo} />
            </SimpleGrid>
        </div>
        )
}