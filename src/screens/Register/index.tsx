import React, { useState } from "react";
import { useForm } from "react-hook-form";
import uuid from "react-native-uuid";
import { useNavigation } from "@react-navigation/native";
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import { 
    Modal, 
    Keyboard,
    Alert
} from "react-native";

import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import { Button } from "../../components/Form/Button";
import { CategorySelectButton } from "../../components/Form/CategorySelectButton";
import { InputForm } from "../../components/Form/InputForm";
import { TransactionTypeButton } from "../../components/TransactionTypeButton";
import { CategorySelect } from "../CategorySelect";

import { 
    Container,
    Header,
    Title,
    Form,
    Fields,
    TransactionTypes
} from "./styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../hooks/auth";

export type FormData = {
    [name: string]: any;
}

type NavigationProps = {
    navigate:(screen:string) => void;
}

const schema = Yup.object().shape({
    name: Yup.string().required('Nome é obrigatório'),
    amount: Yup.number()
        .typeError('Informe um valor numérico')
        .positive('O valor não pode ser negativo')
        .required('O valor é obrigatório')
})

export function Register(){
    const [transactionType, setTransactionType] = useState('')
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)

    const { user } = useAuth();

    const [category, setCategory] = useState({
        key: 'category',
        name: 'Categoria'
    })

    // const navegation = useNavigation<NavigationProps>();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema)
    })

    function handleTransactionTypeSelect(type: 'positive' | 'negative'){
        setTransactionType(type)
    }

    function handleOpenSelectCategoryModal() {
        setCategoryModalOpen(true)
    }

    function handleCloseSelectCategoryModal() {
        setCategoryModalOpen(false)
    }

    async function handleRegister(form: FormData){
        if(!transactionType) {
            return Alert.alert('Selecione o tipo de transação');
        }
      
        if(category.key === 'category') {
            return Alert.alert('Selecione a categoria');
        }
      
        const newTransaction = {
            id: String(uuid.v4()),
            name: form.name,
            amount: form.amount,
            type: transactionType,
            category: category.key,
            date: new Date()
        }

        try {
            const dataKey = `@gofinances:transactions_user:${user.id}`;
            const data = await AsyncStorage.getItem(dataKey);
            const currentData = data ? JSON.parse(data) : [];
            
            const dataFormatted = [
                ...currentData,
                newTransaction
            ]

            await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));
        
            reset();
            setTransactionType('');
            setCategory({
                key: 'category',
                name: 'Categoria'
            });
            setCategoryModalOpen(false);

            // navegation.navigate('Listagem');

        } catch (error) {
            console.log(error);
            Alert.alert("Não foi possível salvar");
        }
    }

    return(
        <TouchableWithoutFeedback 
            onPress={Keyboard.dismiss}
            containerStyle={{ flex: 1 }}
            style={{ flex: 1 }}
        >
            <Container>
                <Header>
                    <Title>Cadastro</Title>
                </Header>

                <Form>
                    <Fields>
                        <InputForm 
                            name="name"
                            control={control}
                            placeholder="Nome"
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            error={errors.name && errors.name.message}
                        />
                        <InputForm 
                            name="amount"
                            control={control}
                            placeholder="Preço"
                            keyboardType="numeric"
                            error={errors.amount && errors.amount.message}
                        />

                        <TransactionTypes>
                            <TransactionTypeButton 
                                type="up"
                                title="Income"
                                onPress={() => handleTransactionTypeSelect('positive')}
                                isActive={transactionType === 'positive'}
                            />
                            <TransactionTypeButton 
                                type="down"
                                title="Outcome"
                                onPress={() => handleTransactionTypeSelect('negative')}
                                isActive={transactionType === 'negative'}
                            />
                        </TransactionTypes>

                        <CategorySelectButton 
                            testID="button-category"
                            title={category.name} 
                            onPress={handleOpenSelectCategoryModal}
                        />
                    </Fields>

                        <Button 
                            title="Enviar"
                            onPress={handleSubmit(handleRegister)}
                        />
                </Form>

                <Modal testID="modal-category" visible={categoryModalOpen}>
                    <CategorySelect 
                        category={category}
                        setCategory={setCategory}
                        closeSelectCategory={handleCloseSelectCategoryModal}
                    />
                </Modal>   
            </Container>
        </TouchableWithoutFeedback> 
    )
}