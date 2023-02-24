import React, {useCallback, useState} from "react";
import {observer} from "mobx-react-lite";
import styled from 'styled-components';
import {useGlobalStore} from "../store";
import {Specification} from "visual-insights";

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: 1px solid #159;
  padding: 2px;
  border-radius: 8px;
`;

const Label = styled.span`
  font-size: 16px;
  color: #555;
`;

const Input = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  padding: 8px;
  background-color: rgba(0, 153, 255, 0.2);
`;

const Button = styled.button`
  background-color: #0099ff;
  color: #0099ff;
  font-size: 16px;
  padding: 4px;
  border: 1px solid #159;
  border-radius: 4px;
  cursor: pointer;
`;

const NlQuery: React.FC = () => {
    const {commonStore, vizStore} = useGlobalStore();
    const {currentDataset} = commonStore;
    const [nlq, setNlqInput] = useState<string>("");
    const [registered, setRegistered] = useState<boolean>(false);
    const [apiKey, setApiKey] = useState<string>("");
    const nlqRequest = (nlq: string) => {
        /*
        See https://platform.openai.com/docs/api-reference/making-requests for more details.
         */
        if (!registered) {
            const token = window.prompt("Please enter your apikey:\nSee https://platform.openai.com/account/api-keys for more details.");
            if (token) {
                setApiKey(token);
                setRegistered(true);
                window.localStorage.setItem("token", token);
            }
        }
        const rawFieldsStr = currentDataset.rawFields.map((f) => f.fid).join(', ');
        const prompt = `"As a professional data analyst, you are tasked with generating an optimal JSON profile based on a given " \\
             "question and database schema. Your goal is to help choose appropriate parameters for multidimensional " \\
             "data visualization. The database schema will be presented in the following format: {tableName}(col1, " \\
             "col2, ...etc). You will be given the following variances to work with: markType, columns, rows, color, " \\
             "opacity, size, and shape. For Mark Type, the available options are Bar, Line, Area, Trail, Scatter, " \\
             "and Rectangle. The other parameters should be filled with a column name in the schema, and some of " \\
             "them can be left blank (filled with 'None')."`
        console.log(`rawFieldsStr: ${rawFieldsStr}`);
        fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: prompt + `\nSchema: ${rawFieldsStr}\nQuestion: ${nlq}\nAnswer:`,
                max_tokens: 200,
                temperature: 0.7,
            })
        })
            .then(response => response.json())
            .then(response => {
                const profile = JSON.parse(response.choices[0].text);
                console.log(profile);
                const tmp: Specification = {
                    position: [profile['columns'], profile['rows']],
                    color: [profile['color']],
                    opacity: [profile['opacity']],
                }
                vizStore.renderSpec(tmp);
            });
        // fetch('http://127.0.0.1:5000/api/nlp2json', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         model: 'text-davinci-003',
        //         schema: `${rawFieldsStr}`,
        //         question: nlq,
        //     })
        // })
        //     .then(response => response.json())
        //     .then(response => {
        //         console.log(response.ans);
        //         const tmp: Specification = {
        //             position: [response.ans['columns'], response.ans['rows']],
        //             color: [response.ans['color']],
        //             opacity: [response.ans['opacity']],
        //         }
        //         console.log(tmp);
        //         vizStore.renderSpec(tmp);
        //     })
    }
    return <div>
        <Container>
            <Label>{"NLQ"}</Label>
            <Input
                type="text"
                value={nlq}
                onChange={(event) => setNlqInput(event.target.value)}
                placeholder={"Please enter your question here"}
            />
            <Button type="submit" onClick={() => nlqRequest(nlq)}>Submit</Button>
        </Container>
    </div>
}

export default observer(NlQuery);